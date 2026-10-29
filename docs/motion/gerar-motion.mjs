// Motion de lançamento (1920x1080, 30fps, 26s): um único canvas claro que a câmera percorre da esquerda para a direita.
// Renderizado quadro a quadro no Chromium e codificado em MP4 com ffmpeg.
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
const FPS=30,DUR=26,STEP=2000;
// Seções do canvas, uma a cada STEP px. A câmera para em cada uma e desliza até a próxima.
const stops=[[0,0],[3.2,0],[4.4,1],[8.2,1],[9.4,2],[13.4,2],[14.6,3],[18.6,3],[19.8,4],[23,4],[24.2,5],[26,5]];
const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"><style>
*{box-sizing:border-box}html,body{width:1920px;height:1080px;margin:0;overflow:hidden;background:#f6f9fe}
body{font-family:Satoshi,sans-serif;-webkit-font-smoothing:antialiased;color:#111827}
#cam{position:absolute;left:0;top:0;width:${STEP*6}px;height:1080px;transform-origin:0 0}
#grid{position:absolute;inset:-400px;background:radial-gradient(#d3dff0 1.6px,#0000 1.7px) 0 0/32px 32px}
#glow{position:absolute;left:0;top:0;width:100%;height:100%;background:${[0,1,2,3,4,5].map(i=>`radial-gradient(700px 520px at ${i*STEP+960}px 700px,#dce9fd${i%2?'cc':'88'},transparent 70%)`).join(',')}}
.o{position:absolute;will-change:transform,opacity}
.sec{position:absolute;top:0;width:${STEP}px;height:1080px}
.h{position:absolute;left:0;right:0;top:118px;text-align:center;font-size:64px;font-weight:500;letter-spacing:-2.4px}.h em{font-style:normal;color:#0869f5}
.k{position:absolute;left:0;right:0;top:84px;text-align:center;font-size:18px;font-weight:700;letter-spacing:2.4px;color:#0869f5}
.card{width:360px;height:450px;border-radius:16px;overflow:hidden;box-shadow:0 30px 70px #0a2a6a26}.card img{width:100%;height:100%;display:block}
.term{left:${960-580}px;top:430px;width:1160px;border-radius:24px;background:#fff;box-shadow:0 30px 80px #0a2a6a1f,0 0 0 1px #e3edfb;overflow:hidden}
.term .bar{height:50px;display:flex;gap:9px;align-items:center;padding:0 20px;background:#f4f7fb;border-bottom:1px solid #e3ebf5}.term .bar i{width:13px;height:13px;border-radius:50%;background:#dbe4f0}
.term .tx{padding:44px 44px 50px;font:500 46px ui-monospace,Menlo,monospace;color:#14213a;white-space:nowrap}.term b{color:#0869f5;font-weight:500}
.cur{display:inline-block;width:22px;height:48px;background:#0869f5;vertical-align:-8px;margin-left:4px}
.step{display:flex;align-items:center;gap:22px;font-size:46px;font-weight:500;letter-spacing:-1.2px;white-space:nowrap}
.step span{width:64px;height:64px;border-radius:50%;background:#e1eeff;color:#0869f5;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700}
.win{width:1300px;border-radius:22px;overflow:hidden;box-shadow:0 40px 100px #0a2a6a2e}.win img{width:100%;display:block}
.end{left:${5*STEP+960-430}px;top:360px;width:860px;padding:52px 60px;border-radius:30px;background:#fff;box-shadow:0 30px 80px #0a2a6a1f,0 0 0 1px #e3edfb;text-align:center}
.end .cmd{font:500 76px ui-monospace,Menlo,monospace;letter-spacing:-3px;color:#0869f5}
.end .l1{margin-top:18px;font-size:40px;font-weight:500;letter-spacing:-1px}
.end .l2{margin-top:26px;display:inline-block;padding:12px 22px;border-radius:999px;background:#f2f7ff;font-size:24px;color:#36507a}
</style>
<div id="cam"><div id="grid"></div><div id="glow"></div>
<div class="o term" id="term"><div class="bar"><i></i><i></i><i></i></div><div class="tx"><b>›</b> <span id="typed"></span><span class="cur" id="cur"></span></div></div>
<div class="sec" style="left:${STEP}px"><div class="k o" id="k1">PROMPT SOLTO</div><div class="h o" id="h1">Sem processo, sai <em>isso.</em></div></div>
${bad.map((s,i)=>`<div class="o card" id="b${i}" style="left:${STEP+960-180+(i-1.5)*400}px;top:330px"><img src="${s}"></div>`).join('')}
<div class="sec" style="left:${STEP*2}px"><div class="k o" id="k2">COM /CARROSSEL</div><div class="h o" id="h2">Com a skill, sai <em>isso.</em></div></div>
${good.map((s,i)=>`<div class="o card" id="g${i}" style="left:${STEP*2+960-180+(i-1.5)*400}px;top:330px"><img src="${s}"></div>`).join('')}
<div class="sec" style="left:${STEP*3}px"><div class="h o" id="h3">O que muda é o <em>processo.</em></div></div>
${['Roteiro aprovado antes do visual','A galeria como referência','Assets da própria marca','Cada slide conferido'].map((t,i)=>`<div class="o step" id="s${i}" style="left:${STEP*3+520}px;top:${330+i*130}px"><span>${i+1}</span>${t}</div>`).join('')}
<div class="sec" style="left:${STEP*4}px"><div class="h o" id="h4">Galeria, versões e <em>comparação.</em></div></div>
<div class="o win" id="win" style="left:${STEP*4+960-650}px;top:250px"><img src="${comp}"></div>
<div class="o end" id="end"><div class="cmd">/carrossel</div><div class="l1">Skill grátis para Claude Code e Codex</div><div class="l2">github.com/guilhermealvestech/carrossel-skill</div></div>
</div>
<script>
const $=id=>document.getElementById(id),cl=v=>Math.max(0,Math.min(1,v));
const io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,out=t=>1-Math.pow(1-cl(t),3);
const stops=${JSON.stringify(stops)};
// Posição da câmera (em seções) e zoom: afasta um pouco no meio de cada travessia.
function cam(t){for(let i=0;i<stops.length-1;i++){const [a,x]=stops[i],[b,y]=stops[i+1];if(t<=b){const k=b>a?cl((t-a)/(b-a)):0;return {x:x+(y-x)*io(k),z:x===y?0:Math.sin(k*Math.PI)}}}return {x:5,z:0}}
// Entrada: aparece subindo, a partir de t0.
const pop=(id,t,t0,d=.7,dy=40,extra='')=>{const p=out((t-t0)/d),e=$(id);e.style.opacity=p;e.style.transform='translateY('+(1-p)*dy+'px) '+extra};
window.render=t=>{
 const c=cam(t),s=1-.08*c.z;
 $('cam').style.transform='translate(960px,540px) scale('+s+') translate('+(-(c.x*${STEP}+960))+'px,-540px)';
 const cmd='/carrossel cliente disse que tá caro';
 pop('term',t,.2,.6);$('typed').textContent=cmd.slice(0,Math.floor(cl((t-.7)/2)*cmd.length));$('cur').style.opacity=Math.floor(t*2.4)%2?1:.2;
 pop('k1',t,3.7);pop('h1',t,3.8);
 [0,1,2,3].forEach(i=>pop('b'+i,t,4+i*.14,.8,60,'rotate('+((i%2?1:-1)*1.5)+'deg)'));
 pop('k2',t,8.9);pop('h2',t,9);
 [0,1,2,3].forEach(i=>{const p=out((t-9.2-i*.14)/.9);pop('g'+i,t,9.2+i*.14,.9,80,'scale('+(.94+.06*p)+')')});
 pop('h3',t,14.1);[0,1,2,3].forEach(i=>pop('s'+i,t,14.6+i*.55,.6,0,'translateX('+(1-out((t-14.6-i*.55)/.6))*-50+'px)'));
 pop('h4',t,19.3);{const p=out((t-19.4)/1.1);pop('win',t,19.4,1.1,60,'scale('+(.95+.05*p)+')')}
 {const p=out((t-23.7)/.9);pop('end',t,23.7,.9,40,'scale('+(.96+.04*p)+')')}
};
</script>`;
const frames=path.join(here,'frames');await rm(frames,{recursive:true,force:true});await mkdir(frames);
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1920,height:1080}});
await pg.setContent(html,{waitUntil:'networkidle'});await pg.evaluate(()=>document.fonts.ready);
for(let f=0;f<FPS*DUR;f++){await pg.evaluate(t=>render(t),f/FPS);await pg.screenshot({path:path.join(frames,String(f).padStart(4,'0')+'.png')})}
await b.close();
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(frames,'%04d.png'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','16','-preset','slow','-movflags','+faststart',path.join(here,'lancamento.mp4')]);
await rm(frames,{recursive:true,force:true});
console.log('ok',path.join(here,'lancamento.mp4'));
