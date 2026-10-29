// v1 "sem skill": slides novos com a marca real da Oratry, sem assets, montados sem processo
// (sem roteiro aprovado, sem galeria como referência, sem checagem). Não é feio de propósito:
// é o genérico correto que um prompt solto entrega. Serve de contraste com a v2.
// Uso: node gerar-v1-sem-skill.mjs && node <skill>/scripts/render.mjs ta-caro/v1 --dir exemplos/oratry
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const head=`<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"><style>
html,body{width:1080px;height:1350px;margin:0;overflow:hidden}body{position:relative;font-family:Satoshi,sans-serif;color:#111827;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 110px;box-sizing:border-box}
.logo{position:absolute;left:60px;top:54px;display:flex;align-items:center;gap:10px;font-size:26px;font-weight:500;color:#0869f5}.logo img{width:28px}
.n{position:absolute;right:60px;top:58px;font-size:24px;color:#8a99ad}
.t{font-size:64px;font-weight:700;line-height:1.15;letter-spacing:-1px}
.p{font-size:32px;color:#6b7a90;margin-top:30px;line-height:1.45}
.btn{margin-top:60px;background:#0869f5;color:#fff;font-size:28px;font-weight:500;padding:20px 40px;border-radius:12px}
.blue{background:#0869f5;color:#fff}.blue .logo,.blue .n{color:#fff}.blue .p{color:#d6e6ff}
</style>`;
const logo=`<div class="logo"><img src="../../marca/logo.svg">Oratry</div>`;
const n=i=>`<div class="n">${i}/4</div>`;
const slides=[
`<body>${logo}${n(1)}<div class="t">Cliente disse que está caro?</div><div class="p">Veja como responder essa objeção e fechar mais vendas.</div>`,
`<body>${logo}${n(2)}<div class="t">Às vezes não é o preço</div><div class="p">Muitas vezes o cliente não entendeu o valor do que você oferece. Antes de responder, pergunte o que ele esperava encontrar e entenda o que é prioridade para ele.</div>`,
`<body class="blue">${logo}${n(3)}<div class="t">Mostre o valor</div><div class="p">Experimente dizer: "Deixa eu te mostrar o que está incluído."</div>`,
`<body>${logo}${n(4)}<div class="t">Treine com a Ora</div><div class="p">Na Oratry você ensaia por voz, recebe feedback e tenta de novo.</div><div class="btn">Link na bio</div>`];
for(const [i,s] of slides.entries())await writeFile(path.join(here,'v1',`slide-0${i+1}.html`),head+s);
