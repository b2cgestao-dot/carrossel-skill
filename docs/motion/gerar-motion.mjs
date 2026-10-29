// Motion de lançamento (1920x1080, 30fps, 24s): um canvas claro único que a câmera percorre com zooms,
// passando slide a slide pelos carrosséis, e efeitos sonoros sintetizados em sincronia com a câmera.
// Uso: node docs/motion/gerar-motion.mjs   (precisa de ffmpeg no PATH)
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('../../skills/carrossel/node_modules/playwright');
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const uri=async(p,t='image/png')=>`data:${t};base64,${(await readFile(path.join(root,p))).toString('base64')}`;
const ex='exemplos/oratry/ta-caro/';
const bad=await Promise.all([1,2,3,4].map(i=>uri(`${ex}v1/slide-0${i}-2x.png`)));
const good=await Promise.all([1,2,3,4].map(i=>uri(`${ex}v2/slide-0${i}-2x.png`)));
const comp=await uri('docs/comparacao.png');
const FPS=30,DUR=24;

// Mundo: cada seção centrada em X, todas na linha y=540. Slides de 360x450.
const X={term:960,bad:3200,good:5600,steps:8000,comp:10400,end:12800};
const sx=(row,i)=>X[row]+(i-1.5)*400;
const CMD='/carrossel cliente disse que tá caro';
// Câmera: [tempo, x, y, zoom]. Pares iguais seguram o quadro; entre eles, ease-in-out.
const Z=2.15;
const cam=[[0,960,540,1],[2.5,960,540,1],[3.2,X.bad,560,.95],[3.9,X.bad,560,.95],
 [4.4,sx('bad',0),540,Z],[4.8,sx('bad',0),540,Z],[5.1,sx('bad',1),540,Z],[5.5,sx('bad',1),540,Z],[5.8,sx('bad',2),540,Z],[6.2,sx('bad',2),540,Z],[6.5,sx('bad',3),540,Z],[6.8,sx('bad',3),540,Z],
 [7.6,X.good,560,.95],[8.4,X.good,560,.95],
 [8.9,sx('good',0),540,Z],[9.8,sx('good',0),540,Z*1.06],[10.2,sx('good',1),540,Z],[10.8,sx('good',1),540,Z*1.04],[11.2,sx('good',2),540,Z],[11.8,sx('good',2),540,Z*1.04],[12.2,sx('good',3),540,Z],[12.8,sx('good',3),540,Z*1.04],
 [13.4,X.good,560,.95],[13.9,X.good,560,.95],
 [14.6,X.steps,540,1],[17.2,X.steps,540,1.04],
 [17.9,X.comp,540,1],[18.5,X.comp,540,1],[19.2,X.comp-300,560,1.75],[20.2,X.comp-300,560,1.82],[20.8,X.comp,540,1],
 [21.5,X.end,540,1],[24,X.end,540,1.05]];
// Eventos de som, derivados da mesma linha do tempo.
const moves=[];for(let i=0;i<cam.length-1;i++){const [a,x,y,z]=cam[i],[b,x2,y2,z2]=cam[i+1];if(Math.abs(x2-x)>50||Math.abs(z2-z)>.2)moves.push([a,b-a,Math.min(1,Math.abs(x2-x)/2400+.35)])}
const typeAt=i=>.6+i*(1.6/CMD.length);
const stepsAt=[0,1,2,3].map(i=>15+i*.5);

const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"><style>
*{box-sizing:border-box}html,body{width:1920px;height:1080px;margin:0;overflow:hidden;background:#f6f9fe}
body{font-family:Satoshi,sans-serif;-webkit-font-smoothing:antialiased;color:#111827}
#cam{position:absolute;left:0;top:0;width:14000px;height:1080px;transform-origin:0 0;filter:url(#mb)}
#grid{position:absolute;inset:-600px;background:radial-gradient(#d3dff0 1.6px,#0000 1.7px) 0 0/32px 32px}
#glow{position:absolute;inset:0;background:${Object.values(X).map((x,i)=>`radial-gradient(760px 560px at ${x}px 640px,#dce9fd${i%2?'cc':'88'},transparent 70%)`).join(',')}}
.o{position:absolute;will-change:transform,opacity}
.h{position:absolute;width:1400px;text-align:center;font-size:62px;font-weight:500;letter-spacing:-2.4px}.h em{font-style:normal;color:#0869f5}
.card{width:360px;height:450px;margin:-225px 0 0 -180px;border-radius:14px;overflow:hidden;box-shadow:0 26px 60px #0a2a6a24}.card img{width:100%;height:100%;display:block}
.term{width:1160px;margin:-95px 0 0 -580px;border-radius:24px;background:#fff;box-shadow:0 30px 80px #0a2a6a1f,0 0 0 1px #e3edfb;overflow:hidden}
.term .bar{height:50px;display:flex;gap:9px;align-items:center;padding:0 20px;background:#f4f7fb;border-bottom:1px solid #e3ebf5}.term .bar i{width:13px;height:13px;border-radius:50%;background:#dbe4f0}
.term .tx{padding:44px;font:500 46px ui-monospace,Menlo,monospace;color:#14213a;white-space:nowrap}.term b{color:#0869f5;font-weight:500}
.cur{display:inline-block;width:22px;height:48px;background:#0869f5;vertical-align:-8px;margin-left:4px}
.step{display:flex;align-items:center;gap:22px;font-size:50px;font-weight:500;letter-spacing:-1.4px;white-space:nowrap}
.step span{width:68px;height:68px;border-radius:50%;background:#e1eeff;color:#0869f5;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700}
.win{width:1300px;margin:-410px 0 0 -650px;border-radius:22px;overflow:hidden;box-shadow:0 40px 100px #0a2a6a2e}.win img{width:100%;display:block}
.end{width:860px;margin:-150px 0 0 -430px;padding:52px 60px;border-radius:30px;background:#fff;box-shadow:0 30px 80px #0a2a6a1f,0 0 0 1px #e3edfb;text-align:center}
.end .cmd{font:500 76px ui-monospace,Menlo,monospace;letter-spacing:-3px;color:#0869f5}
.end .l1{margin-top:18px;font-size:40px;font-weight:500;letter-spacing:-1px}
.end .l2{margin-top:26px;display:inline-block;padding:12px 22px;border-radius:999px;background:#f2f7ff;font-size:24px;color:#36507a}
/* Rótulo fixo na tela: diz o que está sendo mostrado durante os zooms. */
.tag{position:absolute;left:70px;bottom:64px;display:flex;align-items:center;gap:14px;padding:16px 26px 16px 18px;border-radius:999px;background:#ffffffee;box-shadow:0 16px 40px #0a2a6a22,0 0 0 1px #e3edfb;font-size:30px;font-weight:500;opacity:0}
.tag i{width:16px;height:16px;border-radius:50%}
</style>
<svg width="0" height="0" style="position:absolute"><filter id="mb" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur id="mbv" stdDeviation="0 0"/></filter></svg>
<div id="cam"><div id="grid"></div><div id="glow"></div>
<div class="o term" id="term" style="left:${X.term}px;top:540px"><div class="bar"><i></i><i></i><i></i></div><div class="tx"><b>›</b> <span id="typed"></span><span class="cur" id="cur"></span></div></div>
<div class="o h" id="h1" style="left:${X.bad-700}px;top:150px">Sem processo, sai <em>isso.</em></div>
${bad.map((s,i)=>`<div class="o card" id="b${i}" style="left:${sx('bad',i)}px;top:560px"><img src="${s}"></div>`).join('')}
<div class="o h" id="h2" style="left:${X.good-700}px;top:150px">Com a skill, sai <em>isso.</em></div>
${good.map((s,i)=>`<div class="o card" id="g${i}" style="left:${sx('good',i)}px;top:560px"><img src="${s}"></div>`).join('')}
<div class="o h" id="h3" style="left:${X.steps-700}px;top:150px">O que muda é o <em>processo.</em></div>
${['Roteiro aprovado antes do visual','A galeria como referência','Assets da própria marca','Cada slide conferido'].map((t,i)=>`<div class="o step" id="s${i}" style="left:${X.steps-430}px;top:${330+i*135}px"><span>${i+1}</span>${t}</div>`).join('')}
<div class="o h" id="h4" style="left:${X.comp-700}px;top:40px">Galeria, versões e <em>comparação.</em></div>
<div class="o win" id="win" style="left:${X.comp}px;top:590px"><img src="${comp}"></div>
<div class="o end" id="end" style="left:${X.end}px;top:540px"><div class="cmd">/carrossel</div><div class="l1">Skill grátis para Claude Code e Codex</div><div class="l2">github.com/guilhermealvestech/carrossel-skill</div></div>
</div>
<div class="tag" id="tagBad"><i style="background:#c3cddb"></i>Prompt solto</div>
<div class="tag" id="tagGood"><i style="background:#0869f5"></i>Com /carrossel</div>
<script>
const $=id=>document.getElementById(id),cl=v=>Math.max(0,Math.min(1,v));
const io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,out=t=>1-Math.pow(1-cl(t),3),back=t=>{t=cl(t);const c=1.6;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
const K=${JSON.stringify(cam)};
function at(t){for(let i=0;i<K.length-1;i++){const [a,x,y,z]=K[i],[b,x2,y2,z2]=K[i+1];if(t<=b){const k=io(cl((t-a)/(b-a)));
 // Zoom em escala logarítmica: aproximações e afastamentos têm velocidade constante na tela.
 return {x:x+(x2-x)*k,y:y+(y2-y)*k,z:Math.exp(Math.log(z)+(Math.log(z2)-Math.log(z))*k)}}}const l=K[K.length-1];return {x:l[1],y:l[2],z:l[3]}}
const show=(id,o,tr='')=>{const e=$(id);e.style.opacity=o;e.style.transform=tr};
const pop=(id,t,t0,d=.55,dy=40,sc=.92)=>{const p=back((t-t0)/d),f=out((t-t0)/(d*.6));show(id,f,'translateY('+(1-cl(p))*dy+'px) scale('+(sc+(1-sc)*p)+')')};
window.render=t=>{
 const c=at(t),n=at(t+1/30);
 $('cam').style.transform='translate(960px,540px) scale('+c.z+') translate('+(-c.x)+'px,'+(-c.y)+'px)';
 // Desfoque de movimento proporcional à velocidade da câmera na tela.
 const vx=Math.abs(n.x-c.x)*c.z+Math.abs(Math.log(n.z/c.z))*700;$('mbv').setAttribute('stdDeviation',(vx<6?0:Math.min(9,(vx-6)/7)).toFixed(1)+' 0');
 const cmd=${JSON.stringify(CMD)};
 pop('term',t,.1);$('typed').textContent=cmd.slice(0,Math.floor(cl((t-.6)/1.6)*cmd.length));$('cur').style.opacity=Math.floor(t*2.4)%2?1:.2;
 pop('h1',t,3);[0,1,2,3].forEach(i=>pop('b'+i,t,3.05+i*.09,.6,90));
 pop('h2',t,7.4);[0,1,2,3].forEach(i=>pop('g'+i,t,7.45+i*.09,.6,90));
 pop('h3',t,14.4);[0,1,2,3].forEach(i=>{const t0=${JSON.stringify(stepsAt)}[i];pop('s'+i,t,t0,.5,0,.8)});
 pop('h4',t,17.7);pop('win',t,17.8,.7,80,.9);
 pop('end',t,21.3,.7,40,.85);
 const tb=t>4.2&&t<7.2?Math.min(out((t-4.2)/.3),1-out((t-6.9)/.3)):0,tg=t>8.7&&t<13.2?Math.min(out((t-8.7)/.3),1-out((t-12.9)/.3)):0;
 show('tagBad',tb,'translateY('+(1-tb)*20+'px)');show('tagGood',tg,'translateY('+(1-tg)*20+'px)');
};
</script>`;

// Áudio: síntese direta em PCM (sem arquivos de terceiros).
function audio(){
 const SR=44100,N=SR*DUR,L=new Float32Array(N),R=new Float32Array(N);let seed=7;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)*2-1;
 const add=(t,i,v,pan=0)=>{const k=Math.floor(t*SR)+i;if(k>=0&&k<N){L[k]+=v*(1-pan)*.5*2;R[k]+=v*(1+pan)*.5*2}};
 const click=t=>{let lp=0;for(let i=0;i<SR*.035;i++){const e=Math.exp(-i/(SR*.006));lp+= (rnd()-lp)*.6;add(t,i,(rnd()-lp)*e*.16+Math.sin(i/SR*2*Math.PI*1800)*e*.05,rnd()*.2)}};
 const whoosh=(t,d,amp)=>{let a=0,b=0;const n=Math.floor(SR*(d+.25));for(let i=0;i<n;i++){const k=i/n,env=Math.pow(Math.sin(Math.PI*Math.min(1,k*1.15)),2),f=.02+.18*Math.sin(Math.PI*k);a+=f*(rnd()-a);b+=f*(a-b);add(t-.08,i,(a-b)*env*amp*2.2,(k-.5)*1.2)}};
 const pop=(t,f=660,amp=.35)=>{for(let i=0;i<SR*.18;i++){const s=i/SR,e=Math.exp(-s*28);add(t,i,Math.sin(2*Math.PI*(f*s+f*.6*Math.exp(-s*40)/40))*e*amp)}};
 const chime=t=>[[880,.22],[1318.5,.16],[1760,.08]].forEach(([f,a])=>{for(let i=0;i<SR*2.4;i++){const s=i/SR;add(t,i,Math.sin(2*Math.PI*f*s)*Math.exp(-s*1.8)*a*Math.min(1,s*200))}});
 const thump=(t,amp=.5)=>{for(let i=0;i<SR*.3;i++){const s=i/SR;add(t,i,Math.sin(2*Math.PI*(55+90*Math.exp(-s*30))*s)*Math.exp(-s*9)*amp)}};
 // Base: acorde suave que respira e some no final.
 for(let i=0;i<N;i++){const s=i/SR,env=Math.min(1,s/2)*Math.min(1,(DUR-s)/2),lfo=.6+.4*Math.sin(s*.8);const v=(Math.sin(2*Math.PI*130.81*s)+.7*Math.sin(2*Math.PI*196*s)+.5*Math.sin(2*Math.PI*329.63*s)+.3*Math.sin(2*Math.PI*493.88*s))*.018*env*lfo;L[i]+=v;R[i]+=v}
 [...CMD].forEach((_,i)=>click(typeAt(i)));thump(2.45,.35);
 moves.forEach(([t,d,a])=>whoosh(t,d,a));
 [3.05,7.45].forEach(t=>pop(t,520,.25));[17.8].forEach(t=>pop(t,600,.25));
 stepsAt.forEach((t,i)=>pop(t,600+i*120));chime(21.35);
 let peak=0;for(let i=0;i<N;i++)peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));const g=.89/peak;
 const buf=Buffer.alloc(44+N*4);buf.write('RIFF',0);buf.writeUInt32LE(36+N*4,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(2,22);buf.writeUInt32LE(SR,24);buf.writeUInt32LE(SR*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*4,40);
 for(let i=0;i<N;i++){buf.writeInt16LE(Math.round(Math.tanh(L[i]*g)*32767),44+i*4);buf.writeInt16LE(Math.round(Math.tanh(R[i]*g)*32767),46+i*4)}
 return buf;
}

const frames=path.join(here,'frames');await rm(frames,{recursive:true,force:true});await mkdir(frames);
const wav=path.join(frames,'sfx.wav');await writeFile(wav,audio());
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1920,height:1080}});
await pg.setContent(html,{waitUntil:'networkidle'});await pg.evaluate(()=>document.fonts.ready);
for(let f=0;f<FPS*DUR;f++){await pg.evaluate(t=>render(t),f/FPS);await pg.screenshot({path:path.join(frames,String(f).padStart(4,'0')+'.png')})}
await b.close();
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(frames,'%04d.png'),'-i',wav,'-c:v','libx264','-pix_fmt','yuv420p','-crf','16','-preset','slow','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',path.join(here,'lancamento.mp4')]);
await rm(frames,{recursive:true,force:true});
console.log('ok',path.join(here,'lancamento.mp4'));
