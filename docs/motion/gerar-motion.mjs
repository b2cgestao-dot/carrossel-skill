// Motion de lançamento (1920x1080, 30fps, 30s): canvas claro único percorrido por uma câmera com zooms.
// Roteiro: comando → sem skill → com skill → asset novo gerado no Codex (image gen) → galeria real
// com as animações de verdade do slider (abrir, comparar, avançar, copiar legenda) → assinatura.
// Pré-requisito: node docs/motion/capturar-galeria.mjs <galeria/index.html> "<título do card>"
// Uso: node docs/motion/gerar-motion.mjs [t1,t2,...]   (com tempos: só gera prévias desses instantes)
import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('../../skills/carrossel/node_modules/playwright');
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..'),clipDir=path.join(here,'clipes');
const rel=p=>path.relative(clipDir,path.join(root,p)).split(path.sep).join('/');
const P=JSON.parse(await readFile(path.join(here,'capturas/pontos.json'),'utf8'));
const bad=[1,2,3,4].map(i=>rel(`exemplos/oratry/ta-caro/v1/slide-0${i}-2x.png`));
const good=[1,2,3,4].map(i=>rel(`exemplos/oratry/ta-caro/v2/slide-0${i}-2x.png`));
const FPS=30,DUR=30;
const CMD='/carrossel cliente disse que tá caro';

// Mundo: seções em X, linha central y=540. Slides 360x450. Janela: conteúdo 1440x900 sob uma barra de 44px.
const X={term:960,bad:3200,good:5600,think:8000,gal:10600,end:13200};
const sx=(row,i)=>X[row]+(i-1.5)*400;
const WX=X.gal-720,WY=112,wp=([x,y])=>[WX+x,WY+y];
const mid=b=>[b.x+b.width/2,b.y+b.height/2];
// Clipes reais: [início no vídeo, velocidade]. Os quadros guardam o tempo da animação original.
const CL={abrir:[17.28,.55],comparar:[19.25,.55],avancar:[20.85,.6],avancar2:[21.75,.6],copiar:[23.85,0]} // copiar: só o estado real antes do clique; o aviso é nosso (no headless a área de transferência falha);
const shots=Object.fromEntries(Object.entries(P.clips).map(([k,c])=>[k,c.shots]));
const cardPt=[P.tallCard.x+P.tallCard.width/2,P.tallCard.y-250],cardClip=[mid(P.clips.abrir.target)[0],P.clips.abrir.target.y-150];
const cmpPt=mid(P.clips.comparar.target),nxPt=mid(P.clips.avancar.target),dlPt=mid(P.download),cpPt=mid(P.clips.copiar.target);
// Rolagem que alinha a galeria alta com o 1º quadro do clipe real (mesmo card na mesma altura).
const scrollMax=P.fullH-P.vh,scrollCard=P.tallCard.y-P.clips.abrir.target.y;
const scrollK=[[14.2,0],[15.6,scrollMax],[15.9,scrollMax],[16.6,scrollCard]];
// Cursor (coordenadas do conteúdo da janela) e cliques.
const cur=[[16.4,1180,700],[17.2,...cardClip],[17.6,cardClip[0]+60,cardClip[1]+40],[19.1,...cmpPt],[19.5,...cmpPt],[20.75,...nxPt],[22.6,...nxPt],[23.2,...dlPt],[23.7,...dlPt],[24.05,...cpPt],[25.4,...cpPt]];
const clicks=[17.28,19.23,20.83,21.73,23.4,24.13];
const [kx,ky]=wp(cardClip),[cmx,cmy]=wp(cmpPt),[dlx,dly]=wp(dlPt),[cpx,cpy]=wp(cpPt);
const Z=2.15;
const cam=[[0,960,540,1,0],[1.9,960,540,1.04,0],[2.5,X.bad,560,.95,0],[3,X.bad,560,.95,0],
 [3.4,sx('bad',0),540,Z,0],[3.7,sx('bad',0),540,Z,0],[3.95,sx('bad',1),540,Z,0],[4.2,sx('bad',1),540,Z,0],[4.45,sx('bad',2),540,Z,0],[4.7,sx('bad',2),540,Z,0],[4.95,sx('bad',3),540,Z,0],[5.3,sx('bad',3),540,Z*.96,0],
 [5.9,X.good,560,.95,-1],[6.2,X.good,560,.95,0],[6.6,sx('good',0),540,Z,0],[7.2,sx('good',0),540,Z*1.05,0],[7.5,sx('good',1),540,Z,0],[8,sx('good',1),540,Z*1.04,0],[8.3,sx('good',2),540,Z,0],[8.8,sx('good',2),540,Z*1.04,0],[9.1,sx('good',3),540,Z,0],[9.5,sx('good',3),540,Z*1.04,0],
 [10.2,X.think,560,.95,1],[12.6,X.think,560,1.0,0],[13.2,X.think,560,1.06,0],
 [13.8,X.gal,560,1.12,1],[16.3,X.gal,560,1.12,0],[17.1,kx,ky,1.6,0],[17.4,kx,ky,1.65,0],[17.9,X.gal,560,1.12,0],
 [18.8,cmx-260,cmy,1.45,0],[19.6,cmx-300,cmy,1.45,0],[20.3,X.gal-150,600,1.2,0],[22.4,X.gal-150,600,1.24,0],
 [22.9,dlx-200,dly,1.6,0],[23.6,dlx-200,dly,1.6,0],[24,cpx-260,cpy+90,1.6,0],[25.3,cpx-260,cpy+90,1.66,0],
 [26,X.end,540,1,0],[30,X.end,540,1.05,0]];
const moves=[];for(let i=0;i<cam.length-1;i++){const [a,x,y,z]=cam[i],[b,x2,y2,z2]=cam[i+1];if(Math.hypot(x2-x,y2-y)>120||Math.abs(Math.log(z2/z))>.25)moves.push([a,b-a,Math.min(1,Math.hypot(x2-x,y2-y)/2400+.3)])}
const typeAt=i=>.4+i*(1.2/CMD.length);
// Meio-tom do asset: cada ponto da grade (48x32) recebe a intensidade daquela região da imagem.
const sharp=require('../../skills/carrossel/node_modules/sharp');
const GW=48,GH=32;const {data:px}=await sharp(path.join(here,'capturas/asset.png')).resize(GW,GH,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const half=[];for(let i=0;i<GW*GH;i++){const [r,g,b,a]=px.subarray(i*4,i*4+4);const lum=(r*.3+g*.59+b*.11)/255;half.push(+(a/255*(.45+.55*(1-Math.abs(lum-.55)))).toFixed(3))}
// Título animado palavra a palavra.
const words=(id,html,left,top,size=62)=>`<div class="o h" id="${id}" style="left:${left}px;top:${top}px;font-size:${size}px">${html.split(' ').map(w=>`<span class="w">${w}</span>`).join(' ')}</div>`;

const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"><style>
*{box-sizing:border-box}html,body{width:1920px;height:1080px;margin:0;overflow:hidden;background:#f6f9fe}
body{font-family:Satoshi,sans-serif;-webkit-font-smoothing:antialiased;color:#111827}
#cam{position:absolute;left:0;top:0;width:15000px;height:1080px;transform-origin:0 0;filter:url(#mb)}
#grid{position:absolute;inset:-600px;background:radial-gradient(#d3dff0 1.6px,#0000 1.7px) 0 0/32px 32px}
#glow{position:absolute;inset:0;background:${Object.values(X).map((x,i)=>`radial-gradient(760px 560px at ${x}px 640px,#dce9fd${i%2?'cc':'88'},transparent 70%)`).join(',')}}
.o{position:absolute;will-change:transform,opacity}
.h{width:1400px;text-align:center;font-weight:500;letter-spacing:-2.4px}.h em{font-style:normal;color:#0869f5}
.w{display:inline-block;opacity:0}
.card{width:360px;height:450px;margin:-225px 0 0 -180px;border-radius:14px;overflow:hidden;box-shadow:0 26px 60px #0a2a6a24}.card img{width:100%;height:100%;display:block}
.term{width:1160px;margin:-95px 0 0 -580px;border-radius:24px;background:#fff;box-shadow:0 30px 80px #0a2a6a1f,0 0 0 1px #e3edfb;overflow:hidden}
.bar{height:44px;display:flex;gap:9px;align-items:center;padding:0 18px;background:#f4f7fb;border-bottom:1px solid #e3ebf5}.bar i{width:12px;height:12px;border-radius:50%;background:#dbe4f0}
.bar span{margin-left:16px;flex:1;max-width:520px;height:26px;border-radius:8px;background:#fff;border:1px solid #e3ebf5;font:13px ui-monospace,Menlo,monospace;color:#8295af;display:flex;align-items:center;padding:0 12px}
.term .tx{padding:44px;font:500 46px ui-monospace,Menlo,monospace;color:#14213a;white-space:nowrap}.term b{color:#0869f5;font-weight:500}
.caret{display:inline-block;width:22px;height:48px;background:#0869f5;vertical-align:-8px;margin-left:4px}
/* Geração no estilo do Codex, em azul: grade de pontos em onda, tarefas e porcentagem. */
.think{width:1320px;height:800px;margin:-370px 0 0 -660px;border-radius:30px;background:#fff;box-shadow:0 40px 100px #0a2a6a26,0 0 0 1px #e3edfb;overflow:hidden}
.think .top{position:absolute;left:0;right:0;top:0;height:56px;display:flex;align-items:center;gap:12px;padding:0 26px;border-bottom:1px solid #eef3fa;font-size:20px;font-weight:500;color:#5b7291}
.think .top b{width:26px;height:26px;border-radius:8px;background:#111827;color:#fff;font:700 14px Satoshi;display:flex;align-items:center;justify-content:center}
.msg{position:absolute;right:40px;top:84px;max-width:860px;display:flex;align-items:center;gap:16px;padding:16px 22px;border-radius:20px;background:#f2f6fc;font-size:24px;color:#14213a;opacity:0}
.msg img{width:54px;height:54px;border-radius:10px;object-fit:cover;background:#e3eefc}
.canvas{position:absolute;left:210px;top:180px;width:900px;height:600px;border-radius:22px;background:#060d1f;overflow:hidden}
.canvas .lb{position:absolute;left:28px;top:22px;font-size:26px;z-index:3;background:linear-gradient(90deg,#7d8aa3 0,#fff 40%,#7d8aa3 80%) 0 0/300% 100%;-webkit-background-clip:text;color:transparent}
#dots{position:absolute;inset:0;display:grid;grid-template-columns:repeat(${GW},1fr);grid-template-rows:repeat(${GH},1fr);place-items:center}
#dots i{width:15px;height:15px;border-radius:50%;background:#3d8bff}
#asset{position:absolute;left:0;top:0;width:900px;height:600px;object-fit:contain;opacity:0}
.pct{position:absolute;right:26px;bottom:24px;z-index:3;padding:14px 26px;border-radius:999px;background:#ffffff14;border:1px solid #ffffff1f;font:500 40px Satoshi;color:#fff;font-variant-numeric:tabular-nums}
.win{width:1440px;height:944px;border-radius:16px;overflow:hidden;background:#fff;box-shadow:0 40px 100px #0a2a6a2e,0 0 0 1px #e3edfb}
.view{position:absolute;left:0;top:44px;width:1440px;height:900px;overflow:hidden;background:#f8faff}
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
${words('h1','Sem processo, sai <em>isso.</em>',X.bad-700,150)}
${bad.map((s,i)=>`<div class="o card" id="b${i}" style="left:${sx('bad',i)}px;top:560px"><img src="${s}"></div>`).join('')}
<div class="o think" id="think" style="left:${X.think}px;top:540px"><div class="top"><b>&gt;_</b>Codex · image gen</div>
 <div class="msg" id="msg"><img src="${rel('exemplos/oratry/ta-caro/v2/slide-01.png')}">Gera um asset 3D: microfone com balão de fala, no estilo da série anexada.</div>
 <div class="canvas"><div class="lb" id="thl">Gerando imagem</div><div id="dots">${'<i></i>'.repeat(GW*GH)}</div><img id="asset" src="${rel('docs/motion/capturas/asset.png')}"><div class="pct" id="pct">0%</div></div></div>
${words('h2','Com a skill, sai <em>isso.</em>',X.good-700,150)}
${words('h3','Faltou asset? O Codex <em>gera.</em>',X.think-700,70,56)}
${good.map((s,i)=>`<div class="o card" id="g${i}" style="left:${sx('good',i)}px;top:560px"><img src="${s}"></div>`).join('')}
<div class="o win" id="win" style="left:${WX}px;top:${WY-44}px"><div class="bar"><i></i><i></i><i></i><span>carrosseis/index.html</span></div>
 <div class="view"><img id="gimg" src="${rel('docs/motion/capturas/galeria-full.png')}"><img id="clip" style="opacity:0">
 <div id="ring"></div><div id="toast">✓ Legenda copiada</div>
 <svg id="cursor" viewBox="0 0 24 24"><path d="M4 2l15 9-7 1.5 4 7.5-3 1.5-4-7.5L4 19z" fill="#111827" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg></div></div>
<div class="o end" id="end" style="left:${X.end}px;top:540px"><div class="cmd">/carrossel</div><div class="l1">Skill grátis para Claude Code e Codex</div><div class="l2">github.com/guilhermealvestech/carrossel-skill</div></div>
</div>
<div class="tag" id="tagBad"><i style="background:#c3cddb"></i>Prompt solto</div>
<div class="tag" id="tagGood"><i style="background:#0869f5"></i>Com /carrossel</div>
<div class="tag" id="tagGal"><i style="background:#0869f5"></i>Sua galeria · animações reais</div>
<script>
const $=id=>document.getElementById(id),cl=v=>Math.max(0,Math.min(1,v));
const io=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2,out=t=>1-Math.pow(1-cl(t),3),back=t=>{t=cl(t);const c=1.6;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
const K=${JSON.stringify(cam)},S=${JSON.stringify(scrollK)},C=${JSON.stringify(cur)},CL=${JSON.stringify(CL)},SH=${JSON.stringify(shots)},CLK=${JSON.stringify(clicks)};
function lerpK(K,t,logIdx){for(let i=0;i<K.length-1;i++){const a=K[i],b=K[i+1];if(t<=b[0]){const k=io(cl((t-a[0])/(b[0]-a[0])));return a.slice(1).map((v,j)=>j+1===logIdx?Math.exp(Math.log(v)+(Math.log(b[j+1])-Math.log(v))*k):v+(b[j+1]-v)*k)}}return K[K.length-1].slice(1)}
const show=(id,o,tr='')=>{const e=$(id);e.style.opacity=o;e.style.transform=tr};
const pop=(id,t,t0,d=.5,dy=40,sc=.9)=>{const p=back((t-t0)/d),f=out((t-t0)/(d*.6));show(id,f,'translateY('+(1-cl(p))*dy+'px) scale('+(sc+(1-sc)*p)+')')};
const kin=(id,t,t0)=>{show(id,1);[...$(id).querySelectorAll('.w')].forEach((w,i)=>{const p=back((t-t0-i*.07)/.45);w.style.opacity=out((t-t0-i*.07)/.25);w.style.transform='translateY('+(1-cl(p))*50+'px) rotate('+(1-cl(p))*6+'deg)'})};
const dots=[...document.querySelectorAll('#dots i')],HALF=${JSON.stringify(half)};
const win=(t,a,b,f=.3)=>t>a&&t<b?Math.min(out((t-a)/f),1-out((t-(b-f))/f)):0;
// Qual quadro de clipe real mostrar no instante t (o último clipe iniciado manda; antes do 1º, nenhum).
function clipFrame(t){let pick=null;for(const [k,[t0,sp]] of Object.entries(CL)){if(t>=t0){const a=Math.max(0,(t-t0)*sp);let f=SH[k][0][1];for(const [at,ff] of SH[k]){if(at<=a)f=ff;else break}pick=k+'/'+f}}return pick}
window.render=async t=>{
 const [cx,cy,cz,cr]=lerpK(K,t,3),[nx,,nz]=lerpK(K,t+1/30,3);
 $('cam').style.transform='translate(960px,540px) rotate('+cr+'deg) scale('+cz+') translate('+(-cx)+'px,'+(-cy)+'px)';
 const v=Math.abs(nx-cx)*cz+Math.abs(Math.log(nz/cz))*700;$('mbv').setAttribute('stdDeviation',(v<6?0:Math.min(9,(v-6)/7)).toFixed(1)+' 0');
 const cmd=${JSON.stringify(CMD)};pop('term',t,.05);$('typed').textContent=cmd.slice(0,Math.floor(cl((t-.4)/1.2)*cmd.length));$('caret').style.opacity=Math.floor(t*2.4)%2?1:.2;
 kin('h1',t,2.45);[0,1,2,3].forEach(i=>pop('b'+i,t,2.5+i*.06,.45,100));
 kin('h3',t,10.05);pop('think',t,10.1,.6,60,.9);pop('msg',t,10.35,.45,20,.95);
 // Geração: primeiro ruído em onda; depois os pontos assumem o meio-tom do asset; no fim a imagem real revela com foco.
 const g=cl((t-10.6)/1.7),form=io(cl((g-.25)/.6)),rev=out((t-12.35)/.55);
 $('pct').textContent=Math.round(100*(g<1?io(g)*.99:1))+'%';$('pct').style.opacity=1-out((t-12.6)/.3);
 $('thl').style.backgroundPosition=(-(t*140)%300)+'% 0';$('thl').style.opacity=1-rev;
 dots.forEach((d,i)=>{const c=i%${GW},r=Math.floor(i/${GW});const w=(.5+.5*Math.sin(c*.35-r*.22-t*4.6))*(.5+.5*Math.sin(c*.17+r*.4-t*2.8+1.3));
  const sweep=cl((g*1.25-c/${GW-1})*4),target=HALF[i]*sweep,noise=.12+.5*w;
  const val=noise*(1-form)+(target+.04)*form;d.style.transform='scale('+(.15+.95*val).toFixed(3)+')';d.style.opacity=((.15+.85*val)*(1-rev)).toFixed(3)});
 $('asset').style.opacity=rev;$('asset').style.filter='blur('+((1-rev)*18).toFixed(1)+'px) drop-shadow(0 30px 40px #0008)';$('asset').style.transform='scale('+(1.04-.04*rev)+')';
 kin('h2',t,5.75);[0,1,2,3].forEach(i=>pop('g'+i,t,5.8+i*.06,.45,100));
 pop('win',t,13.6,.6,80,.92);
 $('gimg').style.transform='translateY('+(-lerpK(S,Math.max(t,14.2),0)[0])+'px)';
 const f=clipFrame(t),clip=$('clip');
 if(f&&clip.getAttribute('src')!==f){clip.src=f;await clip.decode().catch(()=>{})}
 // Corte seco no clique: a própria animação real de abertura faz a transição.
 clip.style.opacity=f?1:0;
 const [px,py]=lerpK(C,t,0);let press=0,ring=null;CLK.forEach(c=>{if(t>=c-.08&&t<c+.1)press=1;if(t>=c&&t<c+.5)ring=(t-c)/.5});
 const cOn=win(t,16.35,25.5,.2);$('cursor').style.cssText+=';left:'+px+'px;top:'+py+'px;opacity:'+cOn+';transform:scale('+(press?.8:1)+')';
 const r=$('ring');if(ring!==null){r.style.left=px+'px';r.style.top=py+'px';r.style.opacity=(1-ring)*.8;r.style.transform='scale('+(.3+ring)+')'}else r.style.opacity=0;
 const to=win(t,24.2,25.6,.3),tt=$('toast');tt.style.left=(${cpPt[0]}-240)+'px';tt.style.top=(${cpPt[1]}+42)+'px';tt.style.opacity=to;tt.style.transform='translateY('+(1-to)*14+'px) scale('+(.9+.1*to)+')';
 pop('end',t,26.1,.6,40,.85);
 const tb=win(t,3.2,5.6),tg=win(t,6.4,9.8),tgl=win(t,13.8,25.7);
 show('tagBad',tb,'translateY('+(1-tb)*20+'px)');show('tagGood',tg,'translateY('+(1-tg)*20+'px)');show('tagGal',tgl,'translateY('+(1-tgl)*20+'px)');
};
</script>`;

// Áudio: síntese direta em PCM (sem arquivos de terceiros). Trilha leve em Dó maior, efeitos com reverb de envio,
// trilha abaixada (ducking) sob os whooshes e limitador suave no master.
function audio(){
 const SR=44100,N=SR*DUR,L=new Float32Array(N),R=new Float32Array(N),RL=new Float32Array(N),RR=new Float32Array(N),M=new Float32Array(N);
 let seed=7;const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296)*2-1;
 // send: quanto do som vai para o reverb.
 const add=(t,i,v,pan=0,send=.25)=>{const k=Math.floor(t*SR)+i;if(k>=0&&k<N){const l=v*Math.sqrt((1-pan)/2)*1.41,r=v*Math.sqrt((1+pan)/2)*1.41;L[k]+=l;R[k]+=r;RL[k]+=l*send;RR[k]+=r*send}};
 const duck=(t,d,depth=.45)=>{const a=Math.floor(t*SR),n=Math.floor(d*SR);for(let i=-SR*.08;i<n+SR*.25;i++){const k=a+i;if(k<0||k>=N)continue;const e=i<0?(1+i/(SR*.08)):i>n?1-(i-n)/(SR*.25):1;M[k]=Math.max(M[k],depth*cl(e))}};
 const cl=v=>Math.max(0,Math.min(1,v));
 // Tecla: clique curto e seco, com leve variação de timbre.
 const key=(t,j)=>{let lp=0;const f=1500+((j*37)%7)*90;for(let i=0;i<SR*.03;i++){const e=Math.exp(-i/(SR*.004));lp+=(rnd()-lp)*.5;add(t,i,((rnd()-lp)*.09+Math.sin(i/SR*2*Math.PI*f)*.035)*e,((j%5)-2)*.08,.08)}};
 const enter=t=>{key(t,3);for(let i=0;i<SR*.25;i++){const s=i/SR;add(t,i,Math.sin(2*Math.PI*(60+70*Math.exp(-s*35))*s)*Math.exp(-s*10)*.32,0,.1)}};
 // Mouse: "clic" em duas partes (pressionar e soltar).
 const mouse=t=>[[0,1],[.075,.6]].forEach(([o,a])=>{for(let i=0;i<SR*.02;i++){const s=i/SR,e=Math.exp(-s*400);add(t+o,i,(rnd()*.35+Math.sin(2*Math.PI*4200*s)*.6)*e*.16*a,.1,.05)}});
 // Whoosh: ruído com filtro passa-banda que sobe e desce, atravessando o estéreo.
 const whoosh=(t,d,amp,dir=1)=>{let lp1=0,lp2=0,hp=0;const n=Math.floor(SR*(d+.3));for(let i=0;i<n;i++){const k=i/n,env=Math.pow(Math.sin(Math.PI*Math.pow(k,.8)),2.2),fc=.008+.05*Math.pow(Math.sin(Math.PI*k),1.5);
  lp1+=fc*(rnd()-lp1);lp2+=fc*(lp1-lp2);hp+=.01*(lp2-hp);add(t-.1,i,(lp2-hp)*env*amp*3.2,dir*(k-.5)*1.4,.35)}duck(t-.1,d+.3,.35)};
 // Pop: bolha curta com harmônico e queda de afinação.
 const pop=(t,f=660,amp=.2,pan=0)=>{for(let i=0;i<SR*.16;i++){const s=i/SR,e=Math.exp(-s*30)*Math.min(1,s*900),ph=2*Math.PI*(f*s+f*.5*(1-Math.exp(-s*45))/45);add(t,i,(Math.sin(ph)+.25*Math.sin(2*ph))*e*amp,pan,.3)}};
 const swoosh=(t,amp=.22)=>whoosh(t,.22,amp,-1);
 // Brilho da geração: notas da escala subindo, bem baixinho, e um acorde no reveal.
 const tone=(t,f,a,d=.5,pan=0,send=.5)=>{for(let i=0;i<SR*d;i++){const s=i/SR,e=Math.exp(-s*(5/d))*Math.min(1,s*300);add(t,i,(Math.sin(2*Math.PI*f*s)+.15*Math.sin(4*Math.PI*f*s))*e*a,pan,send)}};
 const chime=t=>[[523.25,.14,0],[783.99,.11,-.3],[1046.5,.09,.3],[1567.98,.05,0]].forEach(([f,a,p],j)=>tone(t+j*.06,f,a,2.6,p,.6));
 // Trilha: pad suave (acordes de 4 s) e pulso leve de bumbo a partir da parte com skill.
 const chords=[[130.81,164.81,196,246.94],[110,130.81,164.81,196],[87.31,130.81,174.61,220],[98,146.83,196,246.94]];
 const bed=new Float32Array(N);
 for(let i=0;i<N;i++){const s=i/SR,c=chords[Math.floor(s/4)%4],nx=chords[(Math.floor(s/4)+1)%4],x=cl((s%4-3.6)/.4);let v=0;
  c.forEach((f,j)=>{const g=nx[j];const fr=f+(g-f)*x;v+=Math.sin(2*Math.PI*fr*s+j)*(.5+.5*Math.sin(s*.7+j))});
  bed[i]=v*.022*Math.min(1,s/2.5)*Math.min(1,(DUR-s)/3)}
 const BPM=110,beat=60/BPM;for(let t=5.8;t<25.8;t+=beat){for(let i=0;i<SR*.18;i++){const s=i/SR;bed[Math.floor(t*SR)+i]+=Math.sin(2*Math.PI*(48+60*Math.exp(-s*40))*s)*Math.exp(-s*14)*.11}
  for(let i=0;i<SR*.03;i++){const k=Math.floor((t+beat/2)*SR)+i;if(k<N)bed[k]+=rnd()*Math.exp(-i/(SR*.006))*.012}}
 // Eventos.
 [...CMD].forEach((_,i)=>key(typeAt(i),i));enter(1.75);
 moves.forEach(([t,d,a],i)=>whoosh(t,d,a*.4,i%2?1:-1));
 [2.5,5.8,13.6].forEach((t,i)=>pop(t,520+i*60,.16,(i-1)*.3));
 pop(10.1,600,.16);pop(10.35,760,.1,.3);
 [0,2,4,5,7,9,11,12,14,16,17].forEach((st,k)=>tone(10.6+k*.155,523.25*Math.pow(2,st/12),.035,.35,(k%3-1)*.4,.6));
 chime(12.35);
 clicks.forEach(mouse);Object.values(CL).slice(0,4).forEach(([t])=>swoosh(t+.02));
 pop(24.2,1046,.12,.3);chime(26.15);
 // Reverb de envio: 4 combs em paralelo + 2 allpass (Schroeder).
 const verb=(x)=>{const out=new Float32Array(N);for(const [d,g] of [[1557,.84],[1617,.83],[1491,.85],[1422,.84]]){const buf=new Float32Array(d);let p=0,lp=0;for(let i=0;i<N;i++){const y=buf[p];lp=y*.6+lp*.4;buf[p]=x[i]+lp*g;out[i]+=y*.25;p=(p+1)%d}}
  for(const d of [225,556]){const buf=new Float32Array(d);let p=0;for(let i=0;i<N;i++){const y=buf[p],v=out[i]+y*.5;buf[p]=v;out[i]=y-v*.5;p=(p+1)%d}}return out};
 const wl=verb(RL),wr=verb(RR);
 const outL=new Float32Array(N),outR=new Float32Array(N);let peak=0;
 for(let i=0;i<N;i++){const b=bed[i]*(1-M[i]);outL[i]=L[i]+wl[i]*.6+b;outR[i]=R[i]+wr[i]*.6+b;peak=Math.max(peak,Math.abs(outL[i]),Math.abs(outR[i]))}
 const gn=1.05/peak;
 const buf=Buffer.alloc(44+N*4);buf.write('RIFF',0);buf.writeUInt32LE(36+N*4,4);buf.write('WAVEfmt ',8);buf.writeUInt32LE(16,16);buf.writeUInt16LE(1,20);buf.writeUInt16LE(2,22);buf.writeUInt32LE(SR,24);buf.writeUInt32LE(SR*4,28);buf.writeUInt16LE(4,32);buf.writeUInt16LE(16,34);buf.write('data',36);buf.writeUInt32LE(N*4,40);
 for(let i=0;i<N;i++){buf.writeInt16LE(Math.round(Math.tanh(outL[i]*gn)*.92*32767),44+i*4);buf.writeInt16LE(Math.round(Math.tanh(outR[i]*gn)*.92*32767),46+i*4)}
 return buf;
}

// --audio: refaz só a trilha e troca o áudio do MP4 existente, sem renderizar os quadros de novo.
if(process.argv[2]==='--audio'){const tmp=path.join(here,'sfx.wav'),mp4=path.join(here,'lancamento.mp4'),out=path.join(here,'lancamento-novo.mp4');await writeFile(tmp,audio());
 execFileSync('ffmpeg',['-y','-loglevel','error','-i',mp4,'-i',tmp,'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',out]);
 await rm(tmp);await rm(mp4);execFileSync('mv',[out,mp4]);console.log('ok áudio',mp4);process.exit(0)}

// A página fica dentro de clipes/ para carregar os quadros reais por caminho relativo.
const page=path.join(clipDir,'_motion.html');await writeFile(page,html);
const frames=path.join(here,'frames');await rm(frames,{recursive:true,force:true});await mkdir(frames);
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1920,height:1080}});
await pg.goto(pathToFileURL(page).href,{waitUntil:'networkidle'});await pg.evaluate(()=>document.fonts.ready);
const only=process.argv[2]?process.argv[2].split(',').map(Number):null;
if(only){for(const s of only){await pg.evaluate(t=>render(t),s);await pg.screenshot({path:path.join(here,`previa-${s}.png`)})}await b.close();await rm(frames,{recursive:true,force:true});process.exit(0)}
const wav=path.join(frames,'sfx.wav');await writeFile(wav,audio());
for(let f=0;f<FPS*DUR;f++){await pg.evaluate(t=>render(t),f/FPS);await pg.screenshot({path:path.join(frames,String(f).padStart(4,'0')+'.png')})}
await b.close();
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',path.join(frames,'%04d.png'),'-i',wav,'-c:v','libx264','-pix_fmt','yuv420p','-crf','16','-preset','slow','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart',path.join(here,'lancamento.mp4')]);
await rm(frames,{recursive:true,force:true});
console.log('ok',path.join(here,'lancamento.mp4'));
