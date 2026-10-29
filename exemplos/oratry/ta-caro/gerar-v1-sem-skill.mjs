// v1 "sem skill": o mesmo tema pedido num prompt solto ("faz um carrossel sobre cliente que diz tá caro").
// Fica aqui de propósito, para comparar com a v2 na galeria.
import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const slides=[
 ['💰😱','CLIENTE DISSE QUE ESTÁ CARO?!','Veja como responder 👇'],
 ['🤔💡','DICA 1: NÃO É SOBRE O PREÇO!!','Muitas vezes o cliente não entendeu o VALOR do seu produto ou serviço. Por isso é importante sempre explicar bem os benefícios.'],
 ['🚀✅','DICA 2: MOSTRE O VALOR','Mostre os resultados, os diferenciais e tudo que o cliente vai ganhar ao fechar com você!!'],
 ['🔥📲','TREINE COM A ORATRY!','Baixe agora e melhore sua comunicação 💪 Link na bio!! #vendas #sucesso #foco']];
for(const [i,[e,t,p]] of slides.entries())await writeFile(path.join(here,'v1',`slide-0${i+1}.html`),`<!doctype html><meta charset="utf-8"><style>
html,body{width:1080px;height:1350px;margin:0;overflow:hidden}body{background:linear-gradient(135deg,#7b3fe4,#e94b9a);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;font-family:Arial,sans-serif;color:#fff;padding:90px;box-sizing:border-box}
.e{font-size:120px}.t{font-size:84px;font-weight:700;margin-top:30px;text-shadow:0 6px 18px #0006;line-height:1.1}.p{font-size:38px;margin-top:40px;opacity:.92;line-height:1.35}.n{position:absolute;top:60px;right:70px;font-size:30px;background:#fff3;padding:12px 26px;border-radius:40px}</style>
<div class="n">0${i+1}/04</div><div class="e">${e}</div><div class="t">${t}</div><div class="p">${p}</div>`);
