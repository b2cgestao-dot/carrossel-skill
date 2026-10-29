// v1 "sem skill": slides novos com a marca e os assets reais da Oratry (sem assets), montados sem processo
// (sem roteiro aprovado, sem galeria como referência, sem checagem). Serve de contraste com a v2.
// Uso: node gerar-v1-sem-skill.mjs && node <skill>/scripts/render.mjs ta-caro/v1 --dir exemplos/oratry
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const head=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,700&display=swap"><style>
html,body{width:1080px;height:1350px;margin:0;overflow:hidden}body{position:relative;font-family:Satoshi,sans-serif;color:#111827;background:#fff}
.logo{position:absolute;left:28px;top:24px;display:flex;align-items:center;gap:8px;font-size:22px;color:#0869f5;z-index:2}.logo img{width:24px}
.n{position:absolute;right:30px;top:26px;font:700 34px Arial,sans-serif;z-index:2}
.t{position:relative;text-align:center;font:700 66px Arial,sans-serif;margin:150px 50px 0;line-height:1.15}
.p{position:relative;text-align:center;font:24px Georgia,serif;color:#9aa9bd;margin:24px 120px 0;line-height:1.5}
.btn{position:absolute;left:50%;transform:translateX(-50%);bottom:70px;background:linear-gradient(90deg,#0869f5,#5aa2ff);color:#fff;font:700 28px Arial;padding:20px 40px;border-radius:12px;white-space:nowrap}
</style><body>`;
const logo=`<div class="logo"><img src="../../marca/logo.svg">Oratry</div>`;
const n=i=>`<div class="n">${i}/4</div>`;
const slides=[
`${logo}${n(1)}<div class="t">CLIENTE DISSE “TÁ CARO”? 💸</div><div class="p">Descubra agora as melhores técnicas para responder objeções de preço e fechar mais vendas!!</div>
<div class="btn">Arraste para o lado →</div>`,
`${logo}${n(2)}<div class="t" style="text-align:left;margin-left:60px;font-size:58px">1. Às vezes não é o preço</div>
<div class="p" style="text-align:left;margin-left:60px;margin-right:60px;font-size:30px;color:#5b7291">Muitas vezes o cliente não entendeu o valor do que você oferece. Antes de responder, pergunte o que ele esperava encontrar, entenda o contexto da compra, descubra quais são as prioridades dele e só então apresente sua proposta de forma clara e objetiva.</div>`,
`<div style="position:absolute;inset:0;background:#0869f5"></div><div class="logo" style="color:#fff"><img src="../../marca/logo.svg">Oratry</div><div class="n" style="color:#fff">3/4</div>
<div class="t" style="color:#fff;margin-top:200px">2. MOSTRE O VALOR ✅</div>
<div class="p" style="color:#bcd6ff">"Deixa eu te mostrar o que está incluído"</div>`,
`${logo}${n(4)}<div class="t">TREINE COM A ORA 🚀</div><div class="p">Na Oratry você ensaia por voz, recebe feedback e tenta de novo. Baixe agora e transforme sua comunicação!</div>
<div class="btn">LINK NA BIO 👆</div>`];
for(const [i,s] of slides.entries())await writeFile(path.join(here,'v1',`slide-0${i+1}.html`),head+s);
