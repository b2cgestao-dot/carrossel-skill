// Motion de lançamento (1920x1080, 30fps, 29s): canvas claro único percorrido por uma câmera com zooms.
// Roteiro: comando → geração (estilo Codex) → sem skill → com skill → processo → galeria real com cursor
// (abrir peça, comparar versões, baixar, copiar legenda) → assinatura. Som sintetizado em sincronia.
// Pré-requisito: node docs/motion/capturar-galeria.mjs <galeria/index.html> "<título do card>"
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
const ex='exemplos/oratry/ta-caro/',cap='docs/motion/capturas/';
const bad=await Promise.all([1,2,3,4].map(i=>uri(`${ex}v1/slide-0${i}-2x.png`)));
const good=await Promise.all([1,2,3,4].map(i=>uri(`${ex}v2/slide-0${i}-2x.png`)));
const gal=await uri(cap+'galeria-full.png'),dlg=await Promise.all([1,2,3,4].map(i=>uri(`${cap}dlg-${i}.png`)));
const P=JSON.parse(await readFile(path.join(root,cap,'pontos.json'),'utf8'));
const FPS=30,DUR=29;
const CMD='/carrossel cliente disse que tá caro';

// Mundo: seções em X, linha central y=540. Slides de 360x450. Janela do navegador: conteúdo 1440x900 com barra de 44px.
const X={term:960,think:3000,bad:5200,good:7600,steps:10000,gal:12600,end:15200};
const sx=(row,i)=>X[row]+(i-1.5)*400;
const WX=X.gal-720,WY=112; // canto do conteúdo da janela no mundo
const wp=(x,y)=>[WX+x,WY+y];
const mid=b=>[b.x+b.width/2,b.y+b.height/2];
const cardPt=[P.tallCard.x+P.tallCard.width/2,P.tallCard.y-260];
const cmpPt=mid(P.compare),dlPt=mid(P.download),cpPt=mid(P.copy);
// Rolagem da galeria (px do conteúdo) e momentos-chave.
const scrollMax=P.fullH-P.vh,scrollCard=cardPt[1]-420;
const scrollK=[[15.4,0],[16.9,scrollMax],[17.4,scrollMax],[18.1,scrollCard]];
const T={click1:18.9,dlg1:19.15,click2:20.35,dlg2:20.5,hover:21.3,click3:21.55,dlg4:22.2,click4:23,toast:23.05,end:24.6};
const cardView=[cardPt[0],cardPt[1]-scrollCard]; // cartão na tela já rolada
const cur=[[17.9,1150,640],[18.75,...cardView],[19.3,cardView[0]+40,cardView[1]+30],[20.2,...cmpPt],[20.5,...cmpPt],[21.2,...dlPt],[21.7,...dlPt],[22.1,dlPt[0]+60,dlPt[1]+120],[22.85,...cpPt],[24,...cpPt]];
// Pontos do cursor no espaço da janela: antes do diálogo o cartão está na galeria rolada.
const Z=2.15,[ccx,ccy]=wp(cardPt[0],cardPt[1]-scrollCard),[cmx,cmy]=wp(...cmpPt),[dlx,dly]=wp(...dlPt),[cpx,cpy]=wp(...cpPt);
const cam=[[0,960,540,1],[2.1,960,540,1],[2.7,X.think,540,1],[5,X.think,540,1.06],
 [5.5,X.bad,560,.95],[5.9,X.bad,560,.95],[6.3,sx('bad',0),540,Z],[6.55,sx('bad',0),540,Z],[6.8,sx('bad',1),540,Z],[7.05,sx('bad',1),540,Z],[7.3,sx('bad',2),540,Z],[7.55,sx('bad',2),540,Z],[7.8,sx('bad',3),540,Z],[8,sx('bad',3),540,Z],
 [8.6,X.good,560,.95],[9,X.good,560,.95],[9.4,sx('good',0),540,Z],[10,sx('good',0),540,Z*1.05],[10.3,sx('good',1),540,Z],[10.8,sx('good',1),540,Z*1.04],[11.1,sx('good',2),540,Z],[11.6,sx('good',2),540,Z*1.04],[11.9,sx('good',3),540,Z],[12.4,sx('good',3),540,Z*1.04],
 [12.8,X.good,560,.95],[13.1,X.good,560,.95],[13.6,X.steps,540,1],[14.9,X.steps,540,1.04],
 [15.4,X.gal,560,1.12],[17.9,X.gal,560,1.12],[18.6,ccx,ccy,1.55],[19.2,ccx,ccy,1.6],[19.5,X.gal,560,1.12],
 [20,cmx-150,cmy,1.5],[20.6,cmx-150,cmy,1.55],[21.1,dlx-150,dly,1.55],[21.8,dlx-150,dly,1.55],[22.2,X.gal,560,1.12],[22.6,cpx-200,cpy+80,1.6],[24,cpx-200,cpy+80,1.66],
 [24.6,X.end,540,1],[29,X.end,540,1.05]];
const moves=[];for(let i=0;i<cam.length-1;i++){const [a,x,y,z]=cam[i],[b,x2,y2,z2]=cam[i+1];if(Math.hypot(x2-x,y2-y)>120||Math.abs(Math.log(z2/z))>.25)moves.push([a,b-a,Math.min(1,Math.hypot(x2-x,y2-y)/2400+.3)])}
const typeAt=i=>.5+i*(1.3/CMD.length);
const stepsAt=[0,1,2,3].map(i=>13.75+i*.28);

const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"><style>
*{box-sizing:border-box}html,body{width:1920px;height:1080px;margin:0;overflow:hidden;background:#f6f9fe}
body{font-family:Satoshi,sans-serif;-webkit-font-smoothing:antialiased;color:#111827}
#cam{position:absolute;left:0;top:0;width:17000px;height:1080px;transform-origin:0 0;filter:url(#mb)}
#grid{position:absolute;inset:-600px;background:radial-gradient(#d3dff0 1.6px,#0000 1.7px) 0 0/32px 32px}
#glow{position:absolute;inset:0;background:${Object.values(X).map((x,i)=>`radial-gradient(760px 560px at ${x}px 640px,#dce9fd${i%2?'cc':'88'},transparent 70%)`).join(',')}}
.o{position:absolute;will-change:transform,opacity}
.h{position:absolute;width:1400px;text-align:center;font-size:62px;font-weight:500;letter-spacing:-2.4px}.h em{font-style:normal;color:#0869f5}
.card{width:360px;height:450px;margin:-225px 0 0 -180px;border-radius:14px;overflow:hidden;box-shadow:0 26px 60px #0a2a6a24}.card img{width:100%;height:100%;display:block}
.term{width:1160px;margin:-95px 0 0 -580px;border-radius:24px;background:#fff;box-shadow:0 30px 80px #0a2a6a1f,0 0 0 1px #e3edfb;overflow:hidden}
.bar{height:44px;display:flex;gap:9px;align-items:center;padding:0 18px;background:#f4f7fb;border-bottom:1px solid #e3ebf5}.bar i{width:12px;height:12px;border-radius:50%;background:#dbe4f0}
.bar span{margin-left:16px;flex:1;max-width:520px;height:26px;border-radius:8px;background:#fff;border:1px solid #e3ebf5;font:13px ui-monospace,Menlo,monospace;color:#8295af;display:flex;align-items:center;padding:0 12px}
.term .tx{padding:44px;font:500 46px ui-monospace,Menlo,monospace;color:#14213a;white-space:nowrap}.term b{color:#0869f5;font-weight:500}
.caret{display:inline-block;width:22px;height:48px;background:#0869f5;vertical-align:-8px;margin-left:4px}
/* Painel de geração no estilo do Codex, em azul. */
.think{width:1100px;height:700px;margin:-350px 0 0 -550px;border-radius:30px;background:#060d1f;box-shadow:0 40px 100px #0a2a6a40;overflow:hidden}
.think .lb{position:absolute;left:46px;top:34px;font-size:38px;color:#b9c6dc;letter-spacing:-.5px}
.think .lb b{font-weight:500;background:linear-gradient(90deg,#b9c6dc 0,#fff 40%,#b9c6dc 80%) 0 0/300% 100%;-webkit-background-clip:text;color:transparent}
#dots{position:absolute;left:50px;top:110px;right:50px;bottom:40px;display:grid;grid-template-columns:repeat(30,1fr);grid-template-rows:repeat(15,1fr);place-items:center}
#dots i{width:12px;height:12px;border-radius:50%;background:#3d8bff}
.pct{position:absolute;right:46px;bottom:40px;padding:14px 26px;border-radius:999px;background:#ffffff14;border:1px solid #ffffff1f;backdrop-filter:blur(10px);font:500 40px Satoshi;color:#fff;font-variant-numeric:tabular-nums}
.step{display:flex;align-items:center;gap:22px;font-size:50px;font-weight:500;letter-spacing:-1.4px;white-space:nowrap}
.step span{width:68px;height:68px;border-radius:50%;background:#e1eeff;color:#0869f5;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700}
.win{width:1440px;height:944px;margin:0;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 40px 100px #0a2a6a2e,0 0 0 1px #e3edfb}
.view{position:absolute;left:0;top:44px;width:1440px;height:900px;overflow:hidden}
.view img{position:absolute;left:0;top:0;width:1440px;display:block}
#cursor{position:absolute;width:34px;height:34px;margin:-3px 0 0 -6px;filter:drop-shadow(0 4px 6px #0005);z-index:5}
#ring{position:absolute;width:80px;height:80px;margin:-40px 0 0 -40px;border-radius:50%;border:4px solid #0869f5;opacity:0;z-index:4}
#toast{position:absolute;display:flex;align-items:center;gap:10px;padding:12px 20px;border-radius:999px;background:#111827;color:#fff;font-size:20px;font-weight:500;opacity:0;z-index:6;white-space:nowrap}
.end{width:860px;margin:-150px 0 0 -430px;padding:52px 60px;border-radius:30px;background:#fff;box-shadow:0 30px 80px #0a2a6a1f,0 0 0 1px #e3edfb;text-align:center}
.end .cmd{font:500 76px ui-monospace,Menlo,monospace;letter-spacing:-3px;color:#0869f5}
.end .l1{margin-top:18px;font-size:40px;font-weight:500;letter-spacing:-1px}
.end .l2{margin-top:26px;display:inline-block;padding:12px 22px;border-radius:999px;background:#f2f7ff;font-size:24px;color:#36507a}
.tag{position:absolute;left:70px;top:56px;display:flex;align-items:center;gap:14px;padding:16px 26px 16px 18px;border-radius:999px;background:#ffffffee;box-shadow:0 16px 40px #0a2a6a22,0 0 0 1px #e3edfb;font-size:30px;font-weight:500;opacity:0}
.tag i{width:16px;height:16px;border-radius:50%}
</style>
<svg width="0" height="0" style="position:absolute"><filter id="mb" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur id="mbv" stdDeviation="0 0"/></filter></svg>
<div id="cam"><div id="grid"></div><div id="glow"></div>
<div class="o term" id="term" style="left:${X.term}px;top:540px"><div class="bar"><i></i><i></i><i></i></div><div class="tx"><b>›</b> <span id="typed"></span><span class="caret" id="caret"></span></div></div>
<div class="o think" id="think" style="left:${X.think}px;top:540px"><div class="lb"><b>Criando carrossel</b></div><div id="dots">${'<i></i>'.repeat(450)}</div><div class="pct" id="pct">0%</div></div>
<div class="o h" id="h1" style="left:${X.bad-700}px;top:150px">Sem processo, sai <em>isso.</em></div>
${bad.map((s,i)=>`<div class="o card" id="b${i}" style="left:${sx('bad',i)}px;top:560px"><img src="${s}"></div>`).join('')}
<div class="o h" id="h2" style="left:${X.good-700}px;top:150px">Com a skill, sai <em>isso.</em></div>
${good.map((s,i)=>`<div class="o card" id="g${i}" style="left:${sx('good',i)}px;top:560px"><img src="${s}"></div>`).join('')}
<div class="o h" id="h3" style="left:${X.steps-700}px;top:150px">O que muda é o <em>processo.</em></div>
${['Roteiro aprovado antes do visual','A galeria como referência','Assets da própria marca','Cada slide conferido'].map((t,i)=>`<div class="o step" id="s${i}" style="left:${X.steps-430}px;top:${330+i*135}px"><span>${i+1}</span>${t}</div>`).join('')}
<div class="o win" id="win" style="left:${WX}px;top:${WY-44}px"><div class="bar"><i></i><i></i><i></i><span>carrosseis/index.html</span></div>
 <div class="view"><img id="gimg" src="${gal}">${dlg.map((s,i)=>`<img id="d${i}" src="${s}" style="opacity:0">`).join('')}
 <div id="ring"></div><div id="toast">✓ Legenda copiada</div>
 <svg id="cursor" viewBox="0 0 24 24"><path d="M4 2l15 9-7 1.5 4 7.5-3 1.5-4-7.5L4 19z" fill="#111827" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg></div></div>
<div class="o end" id="end" style="left:${X.end}px;top:540px"><div class="cmd">/carrossel</div><div class="l1">Skill grátis para Claude Code e Codex</div><div class="l2">github.com/guilhermealvestech/carrossel-skill</div></div>
</div>
<div class="tag" id="tagBad"><i style="background:#c3cddb"></i>Prompt solto</div>
<div class="tag" id="tagGood"><i style="background:#0869f5"></i>Com /carrossel</div>
<div class="tag" id="tagGal"><i style="background:#0869f5"></i>Sua galeria</div>
<script>
const $=id=>document.getElementById(id),cl=v=>Math.max(0,Math.min(1,v));
const io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,out=t=>1-Math.pow(1-cl(t),3),back=t=>{t=cl(t);const c=1.6;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
const K=${JSON.stringify(cam)},S=${JSON.stringify(scrollK)},C=${JSON.stringify(cur)},T=${JSON.stringify(T)};
// Interpolação ease-in-out entre chaves [t,...valores]; o zoom (4º valor da câmera) é interpolado em log.
function lerpK(K,t,logIdx){for(let i=0;i<K.length-1;i++){const a=K[i],b=K[i+1];if(t<=b[0]){const k=io(cl((t-a[0])/(b[0]-a[0])));return a.slice(1).map((v,j)=>j+1===logIdx?Math.exp(Math.log(v)+(Math.log(b[j+1])-Math.log(v))*k):v+(b[j+1]-v)*k)}}return K[K.length-1].slice(1)}
const show=(id,o,tr='')=>{const e=$(id);e.style.opacity=o;e.style.transform=tr};
const pop=(id,t,t0,d=.5,dy=40,sc=.9)=>{const p=back((t-t0)/d),f=out((t-t0)/(d*.6));show(id,f,'translateY('+(1-cl(p))*dy+'px) scale('+(sc+(1-sc)*p)+')')};
const dots=[...document.querySelectorAll('#dots i')];
const win=(t,a,b,f=.3)=>t>a&&t<b?Math.min(out((t-a)/f),1-out((t-(b-f))/f)):0;
window.render=t=>{
 const [cx,cy,cz]=lerpK(K,t,3),[nx,,nz]=lerpK(K,t+1/30,3);
 $('cam').style.transform='translate(960px,540px) scale('+cz+') translate('+(-cx)+'px,'+(-cy)+'px)';
 const v=Math.abs(nx-cx)*cz+Math.abs(Math.log(nz/cz))*700;$('mbv').setAttribute('stdDeviation',(v<6?0:Math.min(9,(v-6)/7)).toFixed(1)+' 0');
 // Comando.
 const cmd=${JSON.stringify(CMD)};pop('term',t,.05);$('typed').textContent=cmd.slice(0,Math.floor(cl((t-.5)/1.3)*cmd.length));$('caret').style.opacity=Math.floor(t*2.4)%2?1:.2;
 // Geração: ondas de pontos que atravessam a grade e porcentagem subindo.
 pop('think',t,2.35,.6,60,.9);const g=cl((t-2.6)/2.3);$('pct').textContent=Math.round(100*(g<1?io(g)*.99:1))+'%';
 $('think').querySelector('b').style.backgroundPosition=(-(t*120)%300)+'% 0';
 dots.forEach((d,i)=>{const c=i%30,r=Math.floor(i/30);const w1=Math.sin(c*.42-r*.18-t*4.2),w2=Math.sin(c*.2+r*.5-t*2.6+1.3);const band=cl(1-Math.abs(c/29-(g*1.3-.15))*2.2);
  const val=cl(.15+.45*(.5+.5*w1)*(.5+.5*w2)+.6*band);d.style.transform='scale('+(.25+.85*val).toFixed(3)+')';d.style.opacity=(.15+.85*val).toFixed(3)});
 // Carrosséis.
 pop('h1',t,5.3);[0,1,2,3].forEach(i=>pop('b'+i,t,5.35+i*.07,.5,90));
 pop('h2',t,8.4);[0,1,2,3].forEach(i=>pop('g'+i,t,8.45+i*.07,.5,90));
 pop('h3',t,13.4);[0,1,2,3].forEach(i=>pop('s'+i,t,${JSON.stringify(stepsAt)}[i],.45,0,.75));
 // Galeria real: entra, rola, abre a peça e usa o slider.
 pop('win',t,15.1,.6,80,.92);
 $('gimg').style.transform='translateY('+(-lerpK(S,Math.max(t,15.4),0)[0])+'px)';
 const fade=(id,a,b)=>{$(id).style.opacity=b?Math.min(out((t-a)/.25),1-out((t-b)/.2)):out((t-a)/.25)};
 fade('d0',T.dlg1,T.dlg2);fade('d1',T.dlg2,T.hover);fade('d2',T.hover,T.dlg4);fade('d3',T.dlg4,0);
 $('d0').style.transform='scale('+(.96+.04*back((t-T.dlg1)/.45))+')';$('d0').style.transformOrigin='50% 50%';
 $('d3').style.transform='translateY('+(1-out((t-T.dlg4)/.35))*40+'px)';
 const [px,py]=lerpK(C,t,0),clicks=[T.click1,T.click2,T.click3,T.click4];let press=0,ring=null;
 clicks.forEach(c=>{if(t>=c-.08&&t<c+.12)press=1;if(t>=c&&t<c+.5)ring=(t-c)/.5});
 const cOn=t>17.85&&t<24.2?Math.min(out((t-17.85)/.2),1-out((t-24)/.2)):0;
 $('cursor').style.cssText+=';left:'+px+'px;top:'+(py)+'px;opacity:'+cOn+';transform:scale('+(press?.82:1)+')';
 const r=$('ring');if(ring!==null){r.style.left=px+'px';r.style.top=py+'px';r.style.opacity=(1-ring)*.8;r.style.transform='scale('+(.3+ring)+')'}else r.style.opacity=0;
 const to=t>T.toast?Math.min(out((t-T.toast)/.3),1-out((t-24.1)/.3)):0;const tt=$('toast');tt.style.left=(${JSON.stringify(cpPt)}[0]-230)+'px';tt.style.top=(${JSON.stringify(cpPt)}[1]+40)+'px';tt.style.opacity=to;tt.style.transform='translateY('+(1-to)*14+'px)';
 pop('end',t,24.75,.6,40,.85);
 const tb=win(t,6.1,8.2),tg=win(t,9.2,12.7),tgl=win(t,15.3,24.3);
 show('tagBad',tb,'translateY('+(1-tb)*20+'px)');show('tagGood',tg,'translateY('+(1-tg)*20+'px)');show('tagGal',tgl,'translateY('+(1-tgl)*20+'px)');
};
</script>`;

// Áudio: síntese direta em PCM (sem arquivos de terceiros).
function audio(){
 const SR=44100,N=SR*DUR,L=new Float32Array(N),R=new Float32Array(N);let seed=7;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)*2-1;
 const add=(t,i,v,pan=0)=>{const k=Math.floor(t*SR)+i;if(k>=0&&k<N){L[k]+=v*(1-pan);R[k]+=v*(1+pan)}};
 const key=t=>{let lp=0;for(let i=0;i<SR*.035;i++){const e=Math.exp(-i/(SR*.006));lp+=(rnd()-lp)*.6;add(t,i,(rnd()-lp)*e*.16+Math.sin(i/SR*2*Math.PI*1800)*e*.05,rnd()*.2)}};
 const mouse=t=>{for(let i=0;i<SR*.04;i++){const s=i/SR,e=Math.exp(-s*180);add(t,i,(rnd()*.5+Math.sin(2*Math.PI*3200*s))*e*.22)}};
 const whoosh=(t,d,amp)=>{let a=0,b=0;const n=Math.floor(SR*(d+.25));for(let i=0;i<n;i++){const k=i/n,env=Math.pow(Math.sin(Math.PI*Math.min(1,k*1.15)),2),f=.02+.18*Math.sin(Math.PI*k);a+=f*(rnd()-a);b+=f*(a-b);add(t-.08,i,(a-b)*env*amp*2.2,(k-.5)*1.2)}};
 const pop=(t,f=660,amp=.3)=>{for(let i=0;i<SR*.18;i++){const s=i/SR,e=Math.exp(-s*28);add(t,i,Math.sin(2*Math.PI*(f*s+f*.6*Math.exp(-s*40)/40))*e*amp)}};
 const blip=(t,f)=>{for(let i=0;i<SR*.06;i++){const s=i/SR;add(t,i,Math.sin(2*Math.PI*f*s)*Math.exp(-s*60)*.08,.3)}};
 const chime=t=>[[880,.22],[1318.5,.16],[1760,.08]].forEach(([f,a])=>{for(let i=0;i<SR*2.4;i++){const s=i/SR;add(t,i,Math.sin(2*Math.PI*f*s)*Math.exp(-s*1.8)*a*Math.min(1,s*200))}});
 const thump=(t,amp=.4)=>{for(let i=0;i<SR*.3;i++){const s=i/SR;add(t,i,Math.sin(2*Math.PI*(55+90*Math.exp(-s*30))*s)*Math.exp(-s*9)*amp)}};
 for(let i=0;i<N;i++){const s=i/SR,env=Math.min(1,s/2)*Math.min(1,(DUR-s)/2),lfo=.6+.4*Math.sin(s*.8);const v=(Math.sin(2*Math.PI*130.81*s)+.7*Math.sin(2*Math.PI*196*s)+.5*Math.sin(2*Math.PI*329.63*s)+.3*Math.sin(2*Math.PI*493.88*s))*.016*env*lfo;L[i]+=v;R[i]+=v}
 [...CMD].forEach((_,i)=>key(typeAt(i)));thump(1.95);
 for(let k=0;k<10;k++)blip(2.6+2.3*k/10,700+k*60);pop(4.95,880,.3);
 moves.forEach(([t,d,a])=>whoosh(t,d,a*.8));
 [5.35,8.45,15.1].forEach(t=>pop(t,520,.22));stepsAt.forEach((t,i)=>pop(t,600+i*120));
 [T.click1,T.click2,T.click3,T.click4].forEach(mouse);[T.dlg1,T.dlg4].forEach(t=>whoosh(t,.25,.35));pop(T.toast,1040,.18);
 chime(24.8);
 let peak=0;for(let i=0;i<N;i++)peak=Math.max(peak,Math.abs(L[i]),Math.abs(R[i]));const gn=.89/peak;
 const buf=Buffer.alloc(44+N*4);buf.write('RIFF',0);buf.writeUInt32LE(36+N*4,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(2,22);buf.writeUInt32LE(SR,24);buf.writeUInt32LE(SR*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*4,40);
 for(let i=0;i<N;i++){buf.writeInt16LE(Math.round(Math.tanh(L[i]*gn)*32767),44+i*4);buf.writeInt16LE(Math.round(Math.tanh(R[i]*gn)*32767),46+i*4)}
 return buf;
}

const frames=path.join(here,'frames');await rm(frames,{recursive:true,force:true});await mkdir(frames);
const wav=path.join(frames,'sfx.wav');await writeFile(wav,audio());
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1920,height:1080}});
await pg.setContent(html,{waitUntil:'networkidle'});await pg.evaluate(()=>document.fonts.ready);
const only=process.argv[2]?process.argv[2].split(',').map(Number):null; // prévia: tempos separados por vírgula
if(only){for(const s of only){await pg.evaluate(t=>render(t),s);await pg.screenshot({path:path.join(here,`previa-${s}.png`)})}await b.close();await rm(frames,{recursive:true,force:true});process.exit(0)}
for(let f=0;f<FPS*DUR;f++){await pg.evaluate(t=>render(t),f/FPS);await pg.screenshot({path:path.join(frames,String(f).padStart(4,'0')+'.png')})}
await b.close();
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(frames,'%04d.png'),'-i',wav,'-c:v','libx264','-pix_fmt','yuv420p','-crf','16','-preset','slow','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',path.join(here,'lancamento.mp4')]);
await rm(frames,{recursive:true,force:true});
console.log('ok',path.join(here,'lancamento.mp4'));
