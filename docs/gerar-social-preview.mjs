// Imagem de prévia do repositório no GitHub (Settings > Social preview): 1280x640, menos de 1 MB.
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('../skills/carrossel/node_modules/playwright');
const img=async p=>'data:image/png;base64,'+(await readFile(new URL('../'+p,import.meta.url))).toString('base64');
const slides=await Promise.all([1,2,3,4].map(i=>img(`exemplos/oratry/ta-caro/v2/slide-0${i}.png`)));
const fan=[[-12,-150,40],[-4,-50,8],[4,50,8],[12,150,40]];
const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"><style>
*{box-sizing:border-box}html,body{width:1280px;height:640px;margin:0;overflow:hidden}
body{font-family:Satoshi,sans-serif;-webkit-font-smoothing:antialiased;color:#111827;position:relative;background:radial-gradient(700px 500px at 82% 75%,#dce9fd,transparent 70%),radial-gradient(#d3dff0 1.3px,#0000 1.4px) 0 0/24px 24px,#f8faff}
.l{position:absolute;left:80px;top:150px}
.cmd{font:500 96px ui-monospace,Menlo,monospace;letter-spacing:-4px;color:#0869f5}
.t{margin-top:18px;font-size:38px;font-weight:500;letter-spacing:-1.2px;line-height:1.2;width:560px}
.s{margin-top:26px;display:inline-flex;gap:10px}.s span{padding:10px 18px;border-radius:999px;background:#fff;box-shadow:0 8px 20px #2461b814,0 0 0 1px #e3edfb;font-size:20px;font-weight:500;color:#36507a}
.fan{position:absolute;left:960px;top:330px}
.fan img{position:absolute;width:230px;left:-115px;top:-144px;border-radius:12px;box-shadow:0 24px 50px #0a2a6a33}
</style>
<div class="l"><div class="cmd">/carrossel</div><div class="t">Carrosséis com a cara da sua marca, do roteiro ao PNG 2x.</div>
<div class="s"><span>Claude Code</span><span>Codex</span><span>Open source</span></div></div>
<div class="fan">${slides.map((s,i)=>`<img src="${s}" style="transform:translate(${fan[i][1]}px,${fan[i][2]}px) rotate(${fan[i][0]}deg);z-index:${[1,3,4,2][i]}">`).join('')}</div>`;
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:640}});
await p.setContent(html,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);
await p.screenshot({path:new URL('social-preview.jpg',import.meta.url).pathname,type:'jpeg',quality:92});await b.close();
