---
name: legenda-dinamica
description: Coloca legenda dinâmica palavra por palavra nos vídeos verticais (TikTok/Reels/Shorts) no estilo da marca do usuário — fonte Luckiest Guy, branco com contorno preto, a palavra que está sendo falada em LARANJA com um pulinho, 1 a 3 palavras por vez, numa faixa pequena no meio-baixo da tela (sem tomar espaço da cena e longe dos botões do app). Usa o tempo de cada palavra da transcrição (transcript.json). Use sempre que o usuário pedir legenda, subtítulo, "texto da fala", "legenda dinâmica", "legenda estilo TikTok", "karaokê", ou quando um vídeo com narração for publicado em rede social. Trabalha com "edit" (render), "identidade-visual" (cores e fonte) e a transcrição do áudio.
---

# legenda-dinamica — a fala aparece, palavra por palavra

Pedido do usuário: legenda "legal, sem tomar muito espaço do vídeo e dinâmica" (antes ele não queria
legenda — agora quer, neste formato). Regras tiradas das skills achadas com a find-skills:
**caption-animation** (iart-ai/tiktok-video-skills), **remotion-captions** (remotion-dev/skills) e
**tiktok-captions** (kostja94/marketing-skills — 80% das pessoas assistem sem som; legenda aumenta o
tempo assistido).

## Uso
```html
<g id="legenda"></g>                       <!-- última camada do SVG (por cima de tudo) -->
<script src="legenda.js"></script>
```
```js
fetch('transcript.json') … ou cole o JSON: [{ text, start, end }, ...]   // da transcrição (hyperframes transcribe)
const leg = Legenda($('#legenda'), PALAVRAS, { y: 330, enfase: ['FOGO', 'LEÃO'] })
  .esconder([[24.0, 26.0], [94.6, 999]])      // cartões de desafio e tela final: sem legenda
  .mover([[61.0, 80.0, 1180]]);               // trecho em que a ação ocupa a faixa de baixo
// dentro do __seek:  leg.seek(t);
```
Corrija a transcrição antes (palavras erradas: "festas" → "frestas"), porque a legenda mostra o texto.

## Regras
1. **Tempo real de cada palavra** (da transcrição). Nunca dividir a frase em partes iguais.
2. **Poucas palavras**: 1 a 3 por vez (máx. ~16 letras); quebra na pontuação e nas pausas da fala.
   Cada grupo fica até o próximo começar (não pisca).
3. **Palavra falada em laranja** (#FF7A00) com um pulinho; as já ditas brancas; as que vêm a
   seguir um pouco apagadas. Palavras-chave da história (`enfase`) ficam laranja e 25% maiores.
4. **Legível no celular**: Luckiest Guy ~74 px, contorno preto grosso (20% do tamanho) + sombra.
5. **Sem tomar a cena**: uma linha só, **no alto da tela (y ≈ 330)**, logo abaixo da barra do app
   — ali nos nossos cenários só tem teto, céu ou toldo. O usuário reprovou a faixa do meio-baixo
   (tampava os bonecos e coisas importantes). Nunca nos 420 px de baixo (botões, nome, música)
   nem na lateral direita (ícones). Palavras de impacto e balões ficam de y ≈ 420 para baixo.
6. **Sem briga com os textos de impacto**: esconda nos cartões e na tela final; se uma palavra de
   impacto grande estiver no mesmo lugar, mova a legenda (`mover`) ou mova o impacto.
7. Mantém a regra da `identidade-visual`: textos em português, só a fonte e as cores da marca.
