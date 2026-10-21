# Personagens 2D em SVG — rig e animação

## Sumário
1. Hierarquia do rig
2. Pivôs com svgOrigin
3. Rosto: olhos, sobrancelhas, bocas
4. Ciclos e poses prontas
5. Estilo visual
6. Vários personagens
7. Virar de lado / perfil

## 1. Hierarquia do rig
Desenhe com os **pés em y=0** no espaço local e posicione o personagem com
`transform="translate(x y)"` no `<g id="char">`. A ordem do SVG é a ordem de desenho:
```
#char                 posição na cena (x, y)
  #shadow             sombra no chão (escala com o pulo)
  #body               quique, squash/stretch (pivô 0 0 = pés)
    #leg-l, #leg-r    pivô no quadril
    #arm-r            braço de trás (desenhado antes do tronco)
      #fore-r         antebraço + mão (pivô no cotovelo)
    #torso            respiração (pivô na cintura)
    #head             pivô no pescoço
      #hair, #brows, #eyes(#eye-l,#eye-r), #mouth(.m[data-shape])
    #arm-l            braço da frente (desenhado depois do tronco)
      #fore-l
```
Filhos herdam a transformação do pai: girar `#arm-l` leva o antebraço junto; girar
`#fore-l` dobra só o cotovelo. É isso que permite movimentos naturais com poucos tweens.

## 2. Pivôs com svgOrigin
Use `svgOrigin: "x y"` em coordenadas locais do personagem (as mesmas em que você desenhou).
Não use `transformOrigin: "50% 0%"` em grupos com filhos que giram — o bounding box muda
com a pose e o pivô "anda".
```js
gsap.set('#arm-l',  { svgOrigin: '-100 -400' });  // ombro
gsap.set('#fore-l', { svgOrigin: '-100 -295' });  // cotovelo
gsap.set('#head',   { svgOrigin: '0 -440' });     // pescoço
```
Teste de pivô: `gsap.set(parte, {rotation: 90})`, gere um `--frames 0` e veja se a peça
gira em torno da articulação. Ângulos positivos giram no sentido horário (na tela).

## 3. Rosto
- **Piscar**: `scaleY: 0.08` no grupo do olho por 0.06s com `repeat:1, yoyo:true`.
  Intervalo irregular 2–4s (seed), às vezes piscada dupla. Pisque também antes de
  virar a cabeça — fica muito natural.
- **Olhar**: mova `.pupil` alguns px (±6) na direção do alvo; a cabeça segue 0.1s depois.
- **Sobrancelhas**: `y: -6` = surpresa/ênfase; `rotation` oposta em cada uma = bravo/triste.
- **Bocas** (uma visível por vez, alternadas por `display` no `__seek`):
  `smile` (repouso), `0` fechada/neutra, `1` entreaberta, `2` média, `3` aberta com dentes
  e língua, `4` "O". Para mais precisão, acrescente `5` "F/V" (dentes no lábio) e `6`
  "M/B/P" (lábios pressionados) e mapeie manualmente nos trechos importantes.
- **Expressões**: combine sobrancelhas + boca + olhos (ex.: feliz = olhos `scaleY .7`
  + smile; surpreso = sobrancelhas altas + boca 4 + pupilas menores).

## 4. Ciclos e poses
**Caminhada** (por passo de 0.3s, alternando o sinal `s`):
pernas `±24°` opostas, braços opostos às pernas `±22°`, `#body y: -14` no meio do passo
e 0 no contato, `#char x` linear. Ao parar: pernas a 0 com `power2.out`, squash no corpo,
cabeça com follow-through.

**Corrida**: passos de 0.18s, pernas ±40°, antebraços dobrados (-70°), corpo inclinado
`rotation: 8` e quique maior.

**Pulo**: agacha (`scaleY .85 scaleX 1.1`, 0.15s) → sobe (`y: -220`, `scaleY 1.1`,
`power2.out`, 0.25s) → topo → desce (`power2.in`, 0.25s) → aterrissa (squash 0.1s →
`elastic.out`). Sombra diminui e clareia no ar.

**Aceno**: antecipação 6° → braço a -150° (`back.out`) → antebraço oscila ±28° (`yoyo`,
5–7 repetições) → volta.

**Apontar**: braço a ~-80° (horizontal), antebraço reto, cabeça e pupilas para o alvo.

**Pensar**: mão no queixo (braço -120°, antebraço -100°), olhos para cima, sobrancelha
erguida de um lado.

**Fala**: cabeça balança 2–4° no ritmo das frases, gesto de mão aberta no começo de cada
frase, sobrancelhas sobem em palavras enfatizadas, piscar nas pausas.

## 5. Estilo visual
- Flat com 2–3 tons por material (base, sombra ~12% mais escura) fica limpo e renderiza rápido.
- Bordas arredondadas (`rx`, `stroke-linecap="round"`) combinam com motion suave.
- Cabeça grande (1/3 da altura) = mais expressivo e simpático.
- Paleta: um tom forte para a roupa, pele, cabelo escuro, fundo em tons frios e menos
  saturados para o personagem destacar.
- Se o usuário fornecer uma imagem do personagem, redesenhe-o em partes separadas em SVG
  (não dá para animar uma imagem única com rig); ou recorte a imagem em PNGs por parte
  (cabeça, braços, pernas) e use `<image>` dentro de cada grupo com os mesmos pivôs.

## 6. Vários personagens
Gere o SVG por função para não duplicar código:
```js
function personagem(id, cores) { /* retorna string SVG com ids `${id}-arm-l` etc. */ }
const R = id => ({ arm: `#${id}-arm-l`, fore: `#${id}-fore-l`, head: `#${id}-head` /*...*/ });
```
Dê a cada um um seed diferente de piscadas e tempos de idle levemente distintos —
personagens sincronizados parecem clones. Quem escuta reage (acena com a cabeça, pisca)
enquanto o outro fala.

## 7. Perfil / virar
Espelhar: `scaleX: -1` no `#char` (com `svgOrigin: '0 0'`) faz o personagem olhar para o
outro lado. Para uma virada convincente: pisque, comprima `scaleX` até 0.1 em 0.08s, troque
o lado e volte — o piscar esconde a troca.
