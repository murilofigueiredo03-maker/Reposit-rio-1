---
name: edit
description: Cria e edita vídeos animados feitos em HTML/SVG + GSAP e renderizados para MP4 (Playwright + ffmpeg), com motion de qualidade profissional e personagens 2D animados (rig com pivôs, caminhada, aceno, piscar, respiração, sincronia labial com narração). Use sempre que o usuário pedir vídeo animado, animação de personagem, motion graphics, explainer, vinheta, intro/outro de canal, vídeo para Reels/Shorts/TikTok/YouTube, cena com boneco falando, lip sync, "animar em HTML", GSAP, ou exportar uma animação web para MP4 — mesmo que não diga "HTML" nem "GSAP".
---

# edit — vídeo em HTML com motion e personagens

O vídeo é uma página HTML com uma **única timeline GSAP pausada**. O `render.mjs` abre
a página no Chromium headless, pula para cada quadro (`window.__seek(t)`), tira um
screenshot e envia direto para o ffmpeg. Como o tempo é controlado de fora, o render
é determinístico e sem quadros perdidos, não importa quão pesada seja a cena.

Caminhos abaixo são relativos à pasta desta skill (`SKILL_DIR`).

## 0. Preparar (uma vez por máquina)

```bash
node -v && ffmpeg -version | head -1          # Node 18+ e ffmpeg
[ -d SKILL_DIR/node_modules/playwright ] || npm install --prefix SKILL_DIR
```
Se o Chromium do Playwright não existir, `npx playwright install chromium` (não rode
se `PLAYWRIGHT_BROWSERS_PATH` já aponta para navegadores instalados).

## 1. Roteiro antes do código

Escreva um storyboard curto em "batidas" com tempos — isso evita uma timeline caótica:

```
0.0–2.4  personagem entra caminhando da esquerda
2.4–3.0  para, assenta (squash), olha para a câmera
3.0–4.2  acena
4.2–7.4  fala (narração) + gesto com a mão + balão
7.4–10   letreiro final
```
Defina formato: 1920×1080 (YouTube), 1080×1920 (Reels/Shorts/TikTok), 1080×1080 (feed).
Para vertical, mude o `viewBox`/tamanho do `#stage` e passe `--width 1080 --height 1920`.

## 2. Montar a cena a partir do template

```bash
mkdir -p projeto && cp SKILL_DIR/assets/{template.html,gsap.min.js} projeto/
mv projeto/template.html projeto/cena.html
```
O template já tem: cenário com parallax, câmera com push-in lento, personagem com rig
completo (pernas, braços com cotovelo, cabeça, sobrancelhas, olhos, 6 bocas), caminhada,
assentamento, aceno, fala com gesto, piscadas, respiração, balão e letreiro final. Adapte
o bloco `CONFIG` e as seções `ROTEIRO` — não comece do zero.

**Regras que mantêm o render correto** (quebrar qualquer uma gera vídeo diferente da prévia):
- Tudo que se move entra na `tl`. Nada de `@keyframes`/`transition` CSS, `setTimeout`,
  `requestAnimationFrame` próprio ou `Date.now()`.
- Aleatoriedade só com o `mulberry32(seed)` do template (piscadas, nuvens etc.).
- Nunca `repeat: -1` dentro da `tl` — calcule a contagem a partir da duração total.
- Exponha `window.__timeline`, `window.__duration` e `window.__seek(t)` (o template já faz).
  Estados que não são tweens (ex.: troca de boca) devem ser atualizados dentro de `__seek`.
- Fontes: use as instaladas (`fc-list`) ou embuta `@font-face` com arquivo local; fonte
  remota pode não carregar a tempo.
- Imagens/áudio locais ao lado do HTML, com caminhos relativos.

### Personagens novos
Leia `references/personagens.md` antes de desenhar ou trocar o personagem: hierarquia do
rig, como achar pivôs (`svgOrigin`), conjunto de bocas, poses e ciclos (caminhada, fala,
aceno, pulo, apontar). Para vários personagens, duplique o `<g id="char">` com ids
prefixados (`#ana-arm-l`, `#beto-arm-l`) e uma função `rig(prefix)` que devolve os seletores.

### Qualidade de motion
Leia `references/motion.md` — easings por situação, antecipação, overlap/follow-through,
squash & stretch, arcos, tempos em quadros, câmera e transições. Resumo do que mais
diferencia animação amadora de profissional:
- nada começa e para ao mesmo tempo: defase partes do corpo 0.03–0.1s (overlap);
- toda ação grande tem antecipação (pequeno movimento contrário antes);
- paradas usam `back.out`/`elastic.out` suave, nunca `linear`;
- personagem parado ainda respira e pisca — imobilidade total parece congelado;
- câmera e fundo com movimento lento e contínuo dão profundidade.

## 3. Narração e sincronia labial (opcional)

```bash
python3 SKILL_DIR/scripts/lipsync.py projeto/fala.wav projeto/lipsync.js --offset 4.2 --fps 30
```
Gera `window.LIPSYNC` (formas de boca 0–4 por quadro, a partir da energia do áudio). O
template carrega `lipsync.js` automaticamente e usa `offset`/`duration` para posicionar a
fala; sem esse arquivo ele simula a fala. Várias falas: gere um arquivo por fala com nomes
diferentes (`lipsync_ana.js` usando outra variável) ou concatene os áudios antes.
Se o usuário não tiver áudio e quiser voz, pergunte se ele tem uma ferramenta de TTS;
não há TTS embutido.

## 4. Conferir com quadros de prévia (sempre antes do render final)

```bash
node SKILL_DIR/scripts/render.mjs projeto/cena.html --frames 0.5,2.6,3.6,5,8 --outdir projeto/previews
```
Abra os PNGs (ferramenta Read) e verifique: pivôs no lugar certo (braço gira no ombro,
não no meio), nada cortado na borda, texto cabendo, boca e olhos corretos. Escolha
tempos nos momentos críticos do roteiro. Corrija e repita — é muito mais barato que
renderizar o vídeo inteiro.

## 5. Render final

```bash
node SKILL_DIR/scripts/render.mjs projeto/cena.html projeto/video.mp4 \
  --fps 30 --audio projeto/fala.wav --audio-offset 4.2
```
Opções: `--width/--height` (padrão 1920×1080), `--fps` (30; 60 para motion muito rápido),
`--crf` (18 = alta qualidade; 23 = arquivo menor), `--jpeg` (captura ~2× mais rápida,
qualidade quase igual), `--duration` (força duração). Velocidade típica: ~7–8 quadros/s
em 1080p. Música de fundo + narração: mixe antes com ffmpeg
(`ffmpeg -i musica.mp3 -i fala.wav -filter_complex "[0]volume=0.25[m];[1]adelay=4200:all=1[v];[m][v]amix=inputs=2:duration=first" mix.wav`)
e passe `mix.wav` com `--audio-offset 0`.

Depois confira com `ffprobe` (duração, resolução, áudio) e extraia 1–2 quadros do MP4
(`ffmpeg -ss 5 -i video.mp4 -frames:v 1 q.png`) para garantir que o arquivo final está certo.

## Editar um vídeo existente (MP4 do usuário)

Para cortar, juntar, mudar velocidade ou legendar um vídeo já gravado, use ffmpeg direto.
Para sobrepor uma animação HTML (títulos, lower thirds, personagem por cima do vídeo):
1. Na cena, deixe `html, body` com `background: transparent` e remova os retângulos de fundo.
2. `node SKILL_DIR/scripts/render.mjs cena.html overlay.mov --alpha` (ProRes 4444 com transparência).
3. `ffmpeg -i base.mp4 -i overlay.mov -filter_complex "[0][1]overlay=0:0" -c:a copy final.mp4`

## Entrega

Informe ao usuário o caminho do MP4, duração, resolução e o que cada batida do roteiro faz,
e ofereça ajustes concretos (ritmo, cores, falas). Mantenha `cena.html` — é a "fonte"
editável do vídeo.
