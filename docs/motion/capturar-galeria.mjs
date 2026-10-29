// Captura a galeria real e grava as animações de verdade do slider (abrir peça, comparar, avançar, copiar legenda).
// As animações rodam em câmera lenta via CDP e cada quadro guarda o tempo de animação, para reamostrar a 30fps no motion.
// Uso: node docs/motion/capturar-galeria.mjs <galeria/index.html> "<título do card>"
import {writeFile,mkdir,rm} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const require=createRequire(import.meta.url);
const {chromium}=require('../../skills/carrossel/node_modules/playwright');
const here=path.dirname(fileURLToPath(import.meta.url)),out=path.join(here,'capturas'),clips=path.join(here,'clipes');
const [gallery,title]=process.argv.slice(2);const url=pathToFileURL(path.resolve(gallery)).href;
await mkdir(out,{recursive:true});await rm(clips,{recursive:true,force:true});await mkdir(clips);
const b=await chromium.launch();
// Galeria inteira num viewport alto, para a rolagem do motion.
const tall=await b.newPage({viewport:{width:1440,height:2200},deviceScaleFactor:2});await tall.goto(url);await tall.waitForTimeout(1500);
await tall.screenshot({path:path.join(out,'galeria-full.png')});
const tallCard=await tall.locator(`text=${title}`).locator('visible=true').first().boundingBox();await tall.close();

const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:2});await p.goto(url);await p.waitForTimeout(1500);
const cdp=await p.context().newCDPSession(p);await cdp.send('Animation.enable');
const find=async(sel)=>{for(const f of p.frames()){const l=f.locator(sel).locator('visible=true');if(await l.count())return l.first()}throw new Error('não achei '+sel)};
const RATE=.08,meta={vw:1440,vh:900,fullH:2200,tallCard,clips:{}};
// Grava um clipe: dispara a ação e fotografa até cobrir `dur` segundos de animação.
async function clip(name,action,dur,target){
 const bb=target?await target.boundingBox():null;
 await mkdir(path.join(clips,name));await cdp.send('Animation.setPlaybackRate',{playbackRate:RATE});
 const t0=Date.now();action();const shots=[];
 while((Date.now()-t0)/1000*RATE<dur){const at=(Date.now()-t0)/1000*RATE;const f=`${String(shots.length).padStart(4,'0')}.jpg`;await p.screenshot({path:path.join(clips,name,f),type:'jpeg',quality:92});shots.push([at,f])}
 await cdp.send('Animation.setPlaybackRate',{playbackRate:1});await p.waitForTimeout(1200);
 meta.clips[name]={target:bb,shots};console.log(name,shots.length,'quadros');
}
await p.screenshot({path:path.join(clips,'galeria.jpg'),type:'jpeg',quality:92});
const card=await find(`text=${title}`);await card.scrollIntoViewIfNeeded();
await clip('abrir',()=>card.click(),1.6,card);
const cmp=await find('text=Comparar lado a lado');await clip('comparar',()=>cmp.click(),1.6,cmp);
const next=await find('[aria-label="Próximo slide"]');await clip('avancar',()=>next.click(),1.1,next);
await clip('avancar2',()=>next.click(),1.1,next);
const dl=await find('text=Baixar carrossel');meta.download=await dl.boundingBox();
const leg=await find('text=Legenda');await leg.evaluate(e=>e.scrollIntoView({block:'center'}));await p.waitForTimeout(500);
const copy=await find('.caption-heading button, #copy-caption');
await clip('copiar',()=>copy.click(),.9,copy);
await writeFile(path.join(out,'pontos.json'),JSON.stringify(meta,null,1));await b.close();console.log('ok');
