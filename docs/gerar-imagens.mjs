// Imagem do README: antes/depois a partir do exemplo real (exemplos/oratry/ta-caro).
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('../skills/carrossel/node_modules/playwright');
const img=async v=>'data:image/png;base64,'+(await readFile(new URL(`../exemplos/oratry/ta-caro/${v}/slide-01-2x.png`,import.meta.url))).toString('base64');
const depois=await img('v2'),antesImg=await img('v1');
const antes=`<img src="${antesImg}" style="width:100%;height:100%;display:block">`;
const html=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap"><style>
*{box-sizing:border-box}body{margin:0;width:1600px;height:900px;font-family:'DM Sans',sans-serif;background:#f3f5f9;display:flex;align-items:center;justify-content:center;gap:90px;color:#111827}
.col{display:flex;flex-direction:column;align-items:center;gap:26px}.s{width:520px;height:650px;border-radius:18px;overflow:hidden;box-shadow:0 30px 70px #0a1a3a26}.s img{width:100%;height:100%;display:block}
.l{font-size:30px;font-weight:500;letter-spacing:-.6px}.l small{display:block;text-align:center;font-size:20px;font-weight:400;color:#6b7a90;margin-top:4px}
.arrow{font-size:60px;color:#9aa8bb}</style>
<div class="col"><div class="s" style="transform:rotate(-2deg)">${antes}</div><div class="l">Prompt solto<small>"faz um carrossel sobre X"</small></div></div>
<div class="arrow">→</div>
<div class="col"><div class="s" style="transform:rotate(2deg)"><img src="${depois}"></div><div class="l">Com /carrossel<small>marca, galeria, roteiro e checagem</small></div></div>`;
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1600,height:900},deviceScaleFactor:2});
await p.setContent(html,{waitUntil:'networkidle'});await p.screenshot({path:new URL('antes-depois.png',import.meta.url).pathname});await b.close();
