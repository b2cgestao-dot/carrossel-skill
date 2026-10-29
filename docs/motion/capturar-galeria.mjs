// Captura a galeria real (passada por argumento) e os estados do slider para o motion.
// Uso: node docs/motion/capturar-galeria.mjs <caminho/da/galeria/index.html> "<título do card>"
import {writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('../../skills/carrossel/node_modules/playwright');
const out=path.join(path.dirname(fileURLToPath(import.meta.url)),'capturas');
const [gallery,title]=process.argv.slice(2);
const b=await chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});
await p.goto(pathToFileURL(path.resolve(gallery)).href);await p.waitForTimeout(1500);
// Galeria inteira: viewport alto o bastante para todas as linhas de cards.
const tall=await b.newPage({viewport:{width:1440,height:2200},deviceScaleFactor:2});await tall.goto(pathToFileURL(path.resolve(gallery)).href);await tall.waitForTimeout(1500);
await tall.screenshot({path:path.join(out,'galeria-full.png')});const fullH=2200;
const tallCard=await tall.locator(`text=${title}`).locator('visible=true').first().boundingBox();await tall.close();
const box=async(text)=>{for(const f of p.frames()){const l=f.locator(`text=${text}`).locator('visible=true');if(await l.count())return {l:l.first(),b:await l.first().boundingBox()}}throw new Error('não achei '+text)};
const card=await box(title);await card.l.scrollIntoViewIfNeeded();const scrollY=await p.evaluate(()=>scrollY);const cardBox=await card.l.boundingBox();
await card.l.click();await p.waitForTimeout(2500);await p.screenshot({path:path.join(out,'dlg-1.png')});
const cmp=await box('Comparar lado a lado');await cmp.l.click();await p.waitForTimeout(2200);await p.screenshot({path:path.join(out,'dlg-2.png')});
const dl=await box('Baixar carrossel');await dl.l.hover();await p.waitForTimeout(400);await p.screenshot({path:path.join(out,'dlg-3.png')});
const cap=await box('Legenda');await cap.l.scrollIntoViewIfNeeded();await p.waitForTimeout(600);await p.screenshot({path:path.join(out,'dlg-4.png')});
const copy=await box('Copiar legenda').catch(()=>null)||await (async()=>{for(const f of p.frames()){const l=f.locator('button:has-text("Copiar")').locator('visible=true');const n=await l.count();for(let i=0;i<n;i++){const bb=await l.nth(i).boundingBox();if(bb&&bb.y>(await cap.l.boundingBox()).y-40&&bb.y<(await cap.l.boundingBox()).y+40)return {b:bb}}}})();
await writeFile(path.join(out,'pontos.json'),JSON.stringify({vw:1440,vh:900,fullH,scrollY,card:cardBox,tallCard,compare:cmp.b,download:dl.b,copy:copy?.b},null,1));
await b.close();console.log('ok');
