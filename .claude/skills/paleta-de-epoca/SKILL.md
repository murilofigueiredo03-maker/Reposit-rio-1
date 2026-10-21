---
name: paleta-de-epoca
description: Escolhe as cores de um cenário pelo lugar, época, clima, hora do dia e emoção da cena. Traz paletas de materiais prontas por época (Roma Antiga, Egito, Grécia, Idade Média, Brasil Colônia, Velho Oeste, anos 1920), climas de céu (mediterrâneo, deserto, temperado, tropical, urbano) e um roteiro de cores (color script) com "véus" de emoção — confusão, descoberta, rotina, esforço, nojo, tensão, perigo, alívio, nostalgia, mistério — para a cor acompanhar a história. Use sempre que for montar ou ajustar cores de cenário, fundo, ilustração ou vídeo de uma época/lugar, quando o usuário pedir cores "que remetam" a um ambiente, ou quando uma cena precisa transmitir um sentimento. Trabalha junto com "cenario-ilustrado" (materiais) e "identidade-visual" (o laranja da marca é o foco), com a teoria da skill "color-expert".
---

# paleta-de-epoca — cor que conta onde, quando e como a cena se sente

`assets/paletas.js` define `Paleta`. Carregue **antes** de `cenario.js`; o cenário passa a usar
os materiais da época automaticamente:

```html
<script src="paletas.js"></script>
<script src="cenario.js"></script>
```
```js
const C = Cenario({ epoca: 'roma', hora: 'dia', seed: 8 });   // clima vem da época (Roma = mediterrâneo)
s += C.insula({ ... });                    // reboco, telha, madeira já na cor de Roma
s += Paleta.grade('descoberta');           // véu da emoção, antes do C.atmosfera()
s += C.atmosfera({ grao: 0.3 });
```

## 1. Lugar e época → materiais (de onde vêm as cores)
As cores de um lugar vêm dos **materiais e pigmentos que existiam lá**. `Paleta.EPOCAS[epoca]`
traz reboco, tijolo, telha, madeira, pedra, mármore, calçada, vegetação, cerâmica, tecidos e
uma nota explicando o porquê. Ex.: Roma = terras (ocre, siena, vermelho pompeiano), mármore e
travertino claros, telha de barro; o azul egípcio era raro e caro → só em detalhes.
Épocas: `roma`, `egito`, `grecia`, `medieval`, `brasil-colonia`, `velho-oeste`, `anos20`.
Para uma época nova: pesquise os materiais/pigmentos da época (a skill `color-expert` tem
referências de pigmentos históricos) e acrescente uma entrada no mesmo formato.

## 2. Clima e hora → luz
`Cenario({ hora, clima })`: `dia`, `tarde`, `amanhecer`, `noite`, `interior` × clima
(`mediterraneo`, `deserto`, `temperado`, `tropical`, `urbano`). Regras (color-expert):
- **Dia**: o céu azul enche as sombras → **sombras frias**, partes iluminadas **quentes**.
- **Fogo/vela/lamparina**: tudo puxa para laranja-vermelho; sombras quase pretas, roxas.
- **Nublado/temperado**: pouco contraste entre luz e sombra, cores menos saturadas.
- **Longe = mais claro, menos saturado e da cor do céu** (perspectiva atmosférica).

## 3. Emoção → roteiro de cores (color script)
Monte uma linha do tempo de cor antes de animar: qual emoção cada cena tem e **como a cor
muda** entre elas. `Paleta.grade(nome)` aplica um véu (saturação + tom) por cima do cenário:

| Emoção | Cor | Quando |
|---|---|---|
| `confusao` | apagada, fria, véu | acordar, não entender, sonho |
| `descoberta` | quente, luminosa | revelação, chegada a um lugar |
| `rotina` | quente e calma | dia a dia |
| `esforco` | ocre empoeirado | trabalho, cansaço, calor |
| `nojo` | amarelo-esverdeado | cheiro, sujeira, comida estragada |
| `tensao` | escura, fria, dessaturada | ameaça, noite, suspense |
| `perigo` | laranja contra roxo-escuro | fogo, explosão, ataque |
| `alivio` | pêssego suave | depois do perigo |
| `nostalgia` | sépia | lembrança, passado |
| `misterio` | azul-petróleo | segredo, investigação |

- **Associação e transição**: a cor ligada a um assunto deve mudar quando o assunto muda
  (ex.: o mercado fica verde só enquanto o garum fede). Anime a opacidade do véu na timeline.
- **Cor nova = ruptura**: uma cor que ainda não apareceu entrando de repente (o laranja do fogo
  na noite azul) marca o ponto de virada.
- Os véus ficam **dentro do grupo da cena** (não afetam os personagens, que continuam claros).

## 4. A marca sempre em primeiro plano
O laranja `#FF7A00` da `identidade-visual` é o **foco**: uma cor saturada sobre um cenário mais
contido. Então no cenário: laranja/terracota **mais escuros e menos saturados** (telha `#B5503A`,
cerâmica `#B8613A`) e nenhum laranja puro grande atrás de um texto. Textos sempre com contorno preto.

## Verificar
Olhe uma prévia por cena lado a lado: dá para "sentir" a emoção só pela cor? A transição de cor
acontece no momento certo da narração? O texto laranja continua sendo a coisa mais forte da tela?
