// Confere Node, dependências e navegador antes do primeiro uso.
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
const require=createRequire(import.meta.url);
const skill=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const issues=[];
if(Number(process.versions.node.split('.')[0])<18)issues.push(`Node ${process.versions.node} é antigo; use 18 ou mais novo.`);
for(const dep of ['playwright','sharp'])try{require.resolve(dep)}catch{issues.push(`Falta ${dep}: npm install --prefix "${skill}"`)}
if(!issues.length){
 const {chromium}=require('playwright');
 try{const b=await chromium.launch();await b.close()}catch(error){
  const message=String(error.message||error);
  if(/bootstrap_check_in|MachPortRendezvousServer/.test(message))issues.push('Chromium instalado, mas o sandbox do macOS bloqueou sua execução (MachPortRendezvousServer). Teste em um Terminal com permissão para executar o navegador.');
  else if(!existsSync(chromium.executablePath())||message.includes("Executable doesn't exist"))issues.push(`Falta o Chromium do Playwright: npx --prefix "${skill}" playwright install chromium`);
  else issues.push('Chromium encontrado, mas não iniciou: '+message.split('\n').find(line=>line.trim()));
 }
}
console.log(issues.length?'Pendências:\n- '+issues.join('\n- '):'Tudo pronto.');
process.exit(issues.length?1:0);
