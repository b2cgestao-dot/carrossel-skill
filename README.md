# /carrossel

Skill para Claude Code e Codex que cria carrosséis com a cara da sua marca: do roteiro ao PNG em 2x, com galeria, slider, comparação de versões e legenda pronta.

![Prompt solto vs. /carrossel](docs/antes-depois.png)

## Por que não é "só um prompt"

O que deixa um carrossel bom não é o prompt, é o processo:

1. **Roteiro antes do visual.** A IA propõe a copy slide a slide e só desenha depois do seu ok.
2. **A galeria é a referência.** Cada peça aprovada vira referência para a próxima, então o estilo se mantém.
3. **Assets próprios.** Uma série de imagens no estilo da marca, gerada com image gen a partir de uma âncora aprovada.
4. **Checagem visual.** Cada slide é renderizado e conferido antes de chegar em você.
5. **Gosto acumulado.** Toda recusa ou aprovação vai para um `GOSTO.md`, que a skill lê antes de cada peça. Quanto mais você usa, mais ela acerta.

## Funciona para

- **Marca que já existe:** a skill lê seu site, logo e posts e monta o manual a partir deles.
- **Marca do zero:** faz algumas perguntas, propõe 2 ou 3 direções e monta a identidade com você.

## O que você recebe

| | |
|---|---|
| ![Galeria](docs/galeria.png) | ![Slider](docs/slider.png) |
| **Galeria** com todas as peças e versões | **Slider** com legenda, comparação e download em alta |

Cada slide sai em HTML editável, PNG 1080×1350 e PNG 2160×2700.

Vídeo de 24s: [`docs/motion/lancamento.mp4`](docs/motion/lancamento.mp4)

## Instalação

Requer Node 18+.

```bash
git clone https://github.com/guilhermealvestech/carrossel-skill
cp -r carrossel-skill/skills/carrossel ~/.claude/skills/carrossel   # Claude Code
cp -r carrossel-skill/skills/carrossel ~/.codex/skills/carrossel    # Codex
npm install --prefix ~/.claude/skills/carrossel
npx --prefix ~/.claude/skills/carrossel playwright install chromium
```

Se o `npm install` mostrar um aviso de `allow-scripts`, pode ignorar.

Depois, no seu projeto: peça um carrossel ("faz um carrossel sobre ...") ou rode `/carrossel`. Na primeira vez a skill monta a pasta `carrosseis/` e faz o onboarding da marca.

## Estrutura

```
skills/carrossel/
  SKILL.md                 o workflow
  references/              onboarding, roteiro, visual, image gen, entrega
  scripts/                 render 2x, slider, galeria, setup
  templates/               projeto inicial e slide base
exemplos/oratry/           exemplo real: o mesmo carrossel sem e com a skill
```

## Exemplo

`exemplos/oratry` é um caso real: o carrossel "Cliente disse Tá caro?" da [Oratry](https://oratry.com.br), feito duas vezes. A v1 saiu de um prompt solto; a v2, com a skill. Abra `exemplos/oratry/index.html` e use **Comparar lado a lado**.

![Comparação lado a lado](docs/comparacao.png)

## Licença

MIT
