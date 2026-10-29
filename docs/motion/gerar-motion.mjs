// Motion de lançamento (1920x1080, 30fps): quadro a quadro no Chromium e MP4 com ffmpeg.
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
const bad=await Promise.all([1,2,3,4].map(i=>uri(`${ex}v1/slide-0${i}.png`)));
const good=await Promise.all([1,2,3,4].map(i=>uri(`${ex}v2/slide-0${i}.png`)));
const comp=await uri('docs/comparacao.png');
const logo=await uri('exemplos/oratry/marca/logo.svg','image/svg+xml');
const FPS=30,DUR=24;
const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"><style>
*{box-sizing:border-box}html,body{width:1920px;height:1080px;margin:0;overflow:hidden}
body{font-family:Satoshi,sans-serif;-webkit-font-smoothing:antialiased;color:#111827;background:radial-gradient(1400px 800px at 70% 110%,#dce9fd,transparent 70%),radial-gradient(#dbe6f5 1.4px,#0000 1.5px) 0 0/28px 28px,#f8faff}
.l{position:absolute;opacity:0;will-change:transform,opacity}
.cap{left:0;right:0;top:92px;text-align:center;font-size:64px;font-weight:500;letter-spacing:-2.4px}.cap em{font-style:normal;color:#0869f5}
.term{left:460px;top:390px;width:1000px;border-radius:26px;background:#0f1729;box-shadow:0 40px 90px #0a1a3a40;overflow:hidden}
.term .bar{height:52px;display:flex;gap:10px;align-items:center;padding:0 22px;background:#1a2438}.term .bar i{width:14px;height:14px;border-radius:50%;background:#33415a}
.term .tx{padding:44px 44px 54px;font:500 44px ui-monospace,Menlo,monospace;color:#e6edf8;white-space:nowrap}.term .tx b{color:#5da2ff;font-weight:500}.cur{display:inline-block;width:22px;height:46px;background:#5da2ff;vertical-align:-8px;margin-left:4px}
.sl{width:400px;height:500px;border-radius:16px;overflow:hidden;box-shadow:0 30px 60px #0a1a3a30}.sl img{width:100%;height:100%;display:block}
.step{left:170px;display:flex;align-items:center;gap:22px;font-size:46px;font-weight:500;letter-spacing:-1.2px}.step span{width:60px;height:60px;border-radius:50%;background:#e1eeff;color:#0869f5;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700}
.win{left:300px;top:230px;width:1320px;border-radius:22px;overflow:hidden;box-shadow:0 40px 100px #0a1a3a35}.win img{width:100%;display:block}
.end{left:0;right:0;text-align:center}
</style>
<div class="l cap" id="c1">Um prompt solto entrega <em>isso.</em></div>
<div class="l cap" id="c2">Com a skill, entrega <em>isso.</em></div>
<div class="l cap" id="c3">O que muda é o <em>processo.</em></div>
<div class="l cap" id="c4">Galeria, versões e <em>comparação.</em></div>
<div class="l term" id="term"><div class="bar"><i></i><i></i><i></i></div><div class="tx"><b>›</b> <span id="typed"></span><span class="cur" id="cur"></span></div></div>
${bad.map((s,i)=>`<div class="l sl" id="b${i}"><img src="${s}"></div>`).join('')}
${good.map((s,i)=>`<div class="l sl" id="g${i}"><img src="${s}"></div>`).join('')}
${['Roteiro aprovado antes do visual','Galeria como referência','Assets da própria marca','Checagem de cada slide'].map((t,i)=>`<div class="l step" id="s${i}" style="top:${300+i*130}px"><span>${i+1}</span>${t}</div>`).join('')}
<div class="l win" id="win"><img src="${comp}"></div>
<div class="l end" id="e1" style="top:330px;font:500 150px ui-monospace,Menlo,monospace;letter-spacing:-6px;color:#0869f5">/carrossel</div>
<div class="l end" id="e2" style="top:540px;font-size:56px;font-weight:500;letter-spacing:-1.6px">Skill grátis para Claude Code e Codex</div>
<div class="l end" id="e3" style="top:650px;font-size:36px;color:#5b7291">github.com/guilhermealvestech/carrossel-skill</div>
<div class="l" id="mk" style="left:80px;top:60px;display:flex;align-items:center;gap:12px;font-size:32px;font-weight:500;color:#0869f5;letter-spacing:-1px"><img src="${logo}" style="width:34px">Oratry</div>
<script>
const $=id=>document.getElementById(id),cl=v=>Math.max(0,Math.min(1,v)),ease=t=>1-Math.pow(1-cl(t),3);
// Visível de a até b, com 0.45s de entrada e saída. Retorna o progresso de entrada (0..1) e a opacidade.
const win=(t,a,b,f=.45)=>({p:ease((t-a)/f),o:Math.min(ease((t-a)/f),1-ease((t-(b-f))/f))});
const set=(id,o,tr='')=>{const e=$(id);e.style.opacity=o;e.style.transform=tr};
const fan=(pref,t,a,b,cx,dy=0)=>[0,1,2,3].forEach(i=>{const {p,o}=win(t,a+i*.12,b);const off=(i-1.5);const x=cx+off*260*p-200,r=off*7*p;set(pref+i,o,'translate('+x+'px,'+(300+dy+Math.abs(off)*30*p+(1-p)*80)+'px) rotate('+r+'deg)');$(pref+i).style.left='0';$(pref+i).style.top='0';$(pref+i).style.zIndex=10-Math.abs(Math.round(off*2))});
window.render=t=>{
 const cmd='/carrossel cliente disse que tá caro';
 let w=win(t,0,3.8);set('term',w.o,'translateY('+(1-w.p)*40+'px)');$('typed').textContent=cmd.slice(0,Math.floor(cl((t-.5)/1.8)*cmd.length));$('cur').style.opacity=Math.floor(t*2.5)%2?1:.2;
 w=win(t,0,24);set('mk',w.o);
 w=win(t,3.8,7.4);set('c1',w.o,'translateY('+(1-w.p)*20+'px)');fan('b',t,3.9,7.4,960);
 w=win(t,7.4,11.6);set('c2',w.o,'translateY('+(1-w.p)*20+'px)');fan('g',t,7.5,11.6,960);
 w=win(t,11.6,16.2);set('c3',w.o,'translateY('+(1-w.p)*20+'px)');
 [0,1,2,3].forEach(i=>{const s=win(t,12+i*.5,16.2);set('s'+i,s.o,'translateX('+(1-s.p)*-40+'px)')});
 if(t>11.6&&t<16.2){[0,1,2,3].forEach(i=>{const s=win(t,11.7,16.2);set('g'+i,s.o,'translate('+(1240+i*34)+'px,'+(300+i*26)+'px) rotate('+(i*3-4)+'deg) scale(.9)');$('g'+i).style.zIndex=10-i})}
 w=win(t,16.2,20.4);set('c4',w.o,'translateY('+(1-w.p)*20+'px)');set('win',w.o,'scale('+(0.92+0.08*w.p+(cl((t-16.2)/4.2))*0.04)+')');
 w=win(t,20.4,24.6);['e1','e2','e3'].forEach((id,i)=>{const s=win(t,20.4+i*.25,24.6);set(id,s.o,'translateY('+(1-s.p)*30+'px)')});
};
</script>`;
const frames=path.join(here,'frames');await rm(frames,{recursive:true,force:true});await mkdir(frames);
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1920,height:1080}});
await pg.setContent(html,{waitUntil:'networkidle'});await pg.evaluate(()=>document.fonts.ready);
for(let f=0;f<FPS*DUR;f++){await pg.evaluate(t=>render(t),f/FPS);await pg.screenshot({path:path.join(frames,String(f).padStart(4,'0')+'.png')})}
await b.close();
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(frames,'%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','16','-preset','slow',path.join(here,'lancamento.mp4')]);
await rm(frames,{recursive:true,force:true});
console.log('ok',path.join(here,'lancamento.mp4'));
