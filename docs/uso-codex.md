# Uso no Codex

Este fork preserva a skill original de Guilherme Fortuna e a licença MIT. O repositório contém uma skill, `carrossel`.

## Instalação

Requer Node 18 ou superior. A partir da raiz deste repositório:

```bash
mkdir -p ~/.codex/skills
cp -R skills/carrossel ~/.codex/skills/carrossel
cp LICENSE ~/.codex/skills/carrossel/LICENSE
npm ci --prefix ~/.codex/skills/carrossel
npx --prefix ~/.codex/skills/carrossel playwright install chromium
node ~/.codex/skills/carrossel/scripts/checar-setup.mjs
```

O comando de cópia pressupõe que a pasta de destino ainda não existe. Para atualizar uma instalação existente, preserve a versão anterior antes de substituí-la. A skill fica disponível no próximo turno do Codex.

## Começar um projeto

Na pasta em que você quer guardar as peças:

```bash
node ~/.codex/skills/carrossel/scripts/novo-projeto.mjs --dir carrosseis
```

Peça ao Codex:

> Use a skill carrossel com os arquivos em carrosseis. A marca já tem identidade visual. Leia meu logo e guia de marca, registre as referências e apresente o roteiro antes do visual. Tema: apresentar a agência. Público: donos de óticas. Objetivo: iniciar uma conversa pelo direct.

Confirme a identidade, escolha a capa e aprove o roteiro. Depois a skill cria o HTML, exporta PNG em 1080 × 1350 e 2160 × 2700, confere as imagens e monta a galeria com legenda e download. Ela entrega arquivos; não publica posts.

## Arquivos importantes

- `marca/marca.json`: cores, fonte local e logo.
- `marca/manual.md`: regras da identidade.
- `GOSTO.md`: feedback registrado durante a conversa.
- `assets/*/manifest.json`: biblioteca de imagens e seus usos.
- `carrosseis.json`: peças, legendas e versões.
- `index.html`: galeria gerada.

Prefira fontes locais WOFF2. O cabeçalho da galeria reserva uma área quadrada para o símbolo; use a marca completa nos slides com sua proporção original.

## Gerar a entrega

Depois de criar os slides e registrar a peça em `carrosseis.json`:

```bash
node ~/.codex/skills/carrossel/scripts/render.mjs apresentacao/v1 --dir carrosseis
node ~/.codex/skills/carrossel/scripts/build-viewer.mjs apresentacao --dir carrosseis
node ~/.codex/skills/carrossel/scripts/build-gallery.mjs --dir carrosseis
```

Abra `carrosseis/index.html`. Revisões viram `v2`, `v3` etc. As aprovações da interface ficam no navegador; use a opção de exportação para guardá-las junto dos arquivos. Elas não atualizam automaticamente o `GOSTO.md`.

## macOS e sandbox

Se aparecer `bootstrap_check_in` ou `MachPortRendezvousServer: Permission denied`, o navegador pode estar instalado e sua execução estar bloqueada pelo sandbox. Reinstalar o Chromium não resolve essa permissão. Rode a verificação no Terminal do Mac ou em um ambiente autorizado a executar o navegador. A renderização só está validada depois que a abertura do Chromium e a geração dos PNGs funcionarem.

## Ajustes deste fork

- Substituição da marca também no rótulo `ORATRY` em maiúsculas dos templates.
- Diagnóstico de setup distingue navegador ausente de execução bloqueada no macOS.
