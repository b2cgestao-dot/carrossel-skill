// Motion de lançamento (1920x1080, 30fps, 26s): cena 3D renderizada quadro a quadro no Chromium e MP4 com ffmpeg.
// Uso: node docs/motion/gerar-motion.mjs   (precisa de ffmpeg no PATH)
import {readFile,mkdir,rm} from 'node:fs/promises';
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
const FPS=30,DUR=26;
const grain=`url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(#n)" opacity=".5"/></svg>')}")`;
const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"><style>
*{box-sizing:border-box}html,body{width:1920px;height:1080px;margin:0;overflow:hidden;background:#04070f}
body{font-family:Satoshi,sans-serif;-webkit-font-smoothing:antialiased;color:#eef4ff}
#bg{position:absolute;inset:-10%;background:radial-gradient(900px 600px at 50% 60%,#0b3a8a,transparent 70%),radial-gradient(700px 500px at 80% 20%,#062a66aa,transparent 70%),#04070f}
#stage{position:absolute;inset:0;perspective:1600px;perspective-origin:50% 45%}
#world{position:absolute;inset:0;transform-style:preserve-3d}
.o{position:absolute;left:50%;top:50%;opacity:0;will-change:transform,opacity,filter}
.card{width:440px;height:550px;margin:-275px 0 0 -220px;border-radius:18px;overflow:hidden;box-shadow:0 60px 120px #000a}.card img{width:100%;height:100%;display:block}
.txt{left:0;right:0;text-align:center}
.big{font-size:96px;font-weight:500;letter-spacing:-4px;line-height:1}.big em{font-style:normal;color:#5da2ff}
.small{font-size:30px;color:#9fb6d8;letter-spacing:.5px}
.term{width:1040px;margin-left:-520px;margin-top:-40px;font:500 60px ui-monospace,Menlo,monospace;color:#e6edf8;white-space:nowrap}.term b{color:#5da2ff;font-weight:500}.cur{display:inline-block;width:28px;height:62px;background:#5da2ff;vertical-align:-10px;margin-left:6px;box-shadow:0 0 30px #5da2ff}
.win{width:1400px;margin:-410px 0 0 -700px;border-radius:22px;overflow:hidden;box-shadow:0 80px 160px #000c}.win img{width:100%;display:block}
.step{left:170px;font-size:58px;font-weight:500;letter-spacing:-1.8px;white-space:nowrap}.step span{color:#5da2ff;margin-right:22px}
#sweep{position:absolute;top:0;bottom:0;width:900px;left:0;pointer-events:none;mix-blend-mode:screen;opacity:0;background:linear-gradient(100deg,transparent 30%,#7fb4ff40 50%,transparent 70%)}
#vig{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 50%,transparent 50%,#000c 100%)}
#grain{position:absolute;inset:-50%;pointer-events:none;opacity:.07;background:${grain}}
.bar{position:absolute;left:0;right:0;height:0;background:#000;z-index:9}
</style>
<div id="bg"></div>
<div id="stage"><div id="world">
<div class="o term" id="term"><b>›</b> <span id="typed"></span><span class="cur" id="cur"></span></div>
${bad.map((s,i)=>`<div class="o card" id="b${i}"><img src="${s}"></div>`).join('')}
${good.map((s,i)=>`<div class="o card" id="g${i}"><img src="${s}"></div>`).join('')}
<div class="o win" id="win"><img src="${comp}"></div>
</div></div>
<div class="o txt" id="t1" style="top:110px"><div class="big">Sem processo.</div></div>
<div class="o txt" id="t2" style="top:110px"><div class="big">Com <em>/carrossel.</em></div></div>
${['Roteiro antes do visual','A galeria como referência','Assets da própria marca','Cada slide conferido'].map((t,i)=>`<div class="o step" id="s${i}" style="top:${300+i*120}px"><span>0${i+1}</span>${t}</div>`).join('')}
<div class="o txt" id="t4" style="top:70px"><div class="big" style="font-size:68px">Versões lado a lado.</div></div>
<div class="o txt" id="e1" style="top:340px"><div class="big" style="font:500 170px ui-monospace,Menlo,monospace;letter-spacing:-8px;color:#fff;text-shadow:0 0 60px #2f7dff88">/carrossel</div></div>
<div class="o txt" id="e2" style="top:590px"><div style="font-size:52px;font-weight:500;letter-spacing:-1.4px">Skill grátis para Claude Code e Codex</div></div>
<div class="o txt" id="e3" style="top:680px"><div class="small">github.com/guilhermealvestech/carrossel-skill</div></div>
<div id="sweep"></div><div id="vig"></div><div id="grain"></div>
<div class="bar" id="bt" style="top:0"></div><div class="bar" id="bb" style="bottom:0"></div>
<script>
const $=id=>document.getElementById(id),cl=v=>Math.max(0,Math.min(1,v));
const io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,out=t=>1-Math.pow(1-cl(t),3);
// Janela [a,b] com entrada/saída de f segundos: p = progresso de entrada, o = opacidade, k = progresso total.
const w=(t,a,b,f=.7)=>({p:out((t-a)/f),o:Math.min(out((t-a)/f),1-out((t-(b-f))/f)),k:cl((t-a)/(b-a))});
const css=(id,o,tr,blur=0,extra='')=>{const e=$(id);e.style.opacity=o;e.style.transform=tr;e.style.filter=((blur>.05?'blur('+blur.toFixed(2)+'px) ':'')+extra)||'none'};
window.render=t=>{
 // Câmera com respiração lenta e contínua.
 $('world').style.transform='translateZ('+(Math.sin(t*.25)*20)+'px) rotateY('+(Math.sin(t*.18)*1.5)+'deg)';
 $('bg').style.transform='translate('+(Math.sin(t*.2)*30)+'px,'+(Math.cos(t*.15)*20)+'px) scale(1.05)';
 $('grain').style.transform='translate('+((t*997)%60-30)+'px,'+((t*631)%60-30)+'px)';
 $('bt').style.height=$('bb').style.height=(t<3.2?90:t>22.3?90*out((t-22.3)/1):90*(1-out((t-3.2)/1)))+'px';
 // 1. Terminal.
 let s=w(t,.3,3.8,.6);const cmd='/carrossel cliente disse que tá caro';
 css('term',s.o,'translateZ('+(-200+260*io(s.k))+'px)',(1-s.p)*12);$('typed').textContent=cmd.slice(0,Math.floor(cl((t-.8)/2)*cmd.length));$('cur').style.opacity=Math.floor(t*2.4)%2?1:.25;
 // 2. Sem processo: slides frios, à deriva, fora de foco.
 s=w(t,3.6,8.6);css('t1',s.o,'translateY('+(1-s.p)*30+'px)',(1-s.p)*10);
 [0,1,2,3].forEach(i=>{const c=w(t,3.7+i*.15,8.6,.9),x=(i-1.5)*480,z=-300-Math.abs(i-1.5)*200+c.k*160;
  css('b'+i,c.o*.9,'translate3d('+x+'px,'+(70+(i%2)*40-c.k*30)+'px,'+z+'px) rotateY('+(-(i-1.5)*14)+'deg) rotateZ('+((i%2?1:-1)*3)+'deg)',(1-c.p)*20+Math.abs(i-1.5)*1.5,'saturate(.6) brightness(.8)')});
 // 3. Com a skill: surgem da profundidade com foco puxado e varredura de luz.
 s=w(t,8.6,13.8);css('t2',s.o,'translateY('+(1-s.p)*30+'px)',(1-s.p)*10);
 $('sweep').style.opacity=t>9.6&&t<11.4?Math.sin((t-9.6)/1.8*Math.PI):0;$('sweep').style.transform='translateX('+(-900+cl((t-9.6)/1.8)*2800)+'px)';
 if(t<13.8)[0,1,2,3].forEach(i=>{const c=w(t,8.8+i*.18,13.8,1),x=(i-1.5)*470*c.p,z=-900+800*io(cl((t-8.8-i*.18)/1.4));
  css('g'+i,c.o,'translate3d('+x+'px,'+(80-(1-c.p)*120)+'px,'+z+'px) rotateY('+(-(i-1.5)*12*c.p)+'deg)',(1-c.p)*24)});
 // 4. Processo: os slides recuam em pilha à direita e os passos entram no ritmo.
 if(t>=13.8)[0,1,2,3].forEach(i=>{const c=w(t,13.8,19,.8),k=io(cl((t-13.8)/1.2));
  css('g'+i,c.o,'translate3d('+(520+i*40)+'px,'+(40+i*30)+'px,'+(-200-i*160+c.k*80)+'px) rotateY('+(-22*k)+'deg) rotateZ('+(i*2-3)+'deg)',i*2)});
 [0,1,2,3].forEach(i=>{const c=w(t,14.2+i*.75,19,.5);css('s'+i,c.o,'translateX('+(1-c.p)*-60+'px)',(1-c.p)*8)});
 // 5. Galeria: plano inclinado que se endireita.
 s=w(t,19,23.2,.9);const k=io(cl((t-19)/2.4));
 css('t4',s.o,'translateY('+(1-s.p)*30+'px)',(1-s.p)*10);
 css('win',s.o,'translate3d(0,'+(70-k*20)+'px,'+(-500+k*380)+'px) rotateX('+(28*(1-k))+'deg) rotateY('+(-14*(1-k))+'deg)',(1-s.p)*14);
 // 6. Assinatura.
 ['e1','e2','e3'].forEach((id,i)=>{const c=w(t,23+i*.35,27,.9);css(id,c.o,'translateY('+(1-c.p)*24+'px) scale('+(1.04-.04*c.p)+')',(1-c.p)*14)});
};
</script>`;
const frames=path.join(here,'frames');await rm(frames,{recursive:true,force:true});await mkdir(frames);
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1920,height:1080}});
await pg.setContent(html,{waitUntil:'networkidle'});await pg.evaluate(()=>document.fonts.ready);
for(let f=0;f<FPS*DUR;f++){await pg.evaluate(t=>render(t),f/FPS);await pg.screenshot({path:path.join(frames,String(f).padStart(4,'0')+'.png')})}
await b.close();
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(frames,'%04d.png'),'-vf','fade=in:0:15,fade=out:'+(FPS*DUR-20)+':20','-c:v','libx264','-pix_fmt','yuv420p','-crf','16','-preset','slow','-movflags','+faststart',path.join(here,'lancamento.mp4')]);
await rm(frames,{recursive:true,force:true});
console.log('ok',path.join(here,'lancamento.mp4'));
