---
name: movimento-humano
description: Anima stickman/boneco 2D em SVG com função motora humana — articulações reais (quadril, joelho, tornozelo, pé, ombro, cotovelo, mão), cinemática inversa para o pé ficar plantado no chão, ciclos de caminhada/corrida/escada com calcanhar→ponta, braços em oposição às pernas, sentar, pular, deitar/levantar, comer, pensar, acenar, apontar, segurar objetos. Use sempre que um vídeo/animação tiver personagem andando, correndo, subindo escada, gesticulando ou interagindo com objetos — junto com a skill "edit" (render) — e sempre que o usuário reclamar que o boneco "anda errado", "pé virado", "braço estranho" ou "movimento não natural".
---

# movimento-humano — boneco que se move como gente

O stickman antigo (template da skill `edit`) tinha pernas de um osso só e andava de frente para a
câmera: o pé não apontava para onde ele ia e a perna girava como compasso. Esta skill troca isso
por um **boneco articulado** (`assets/boneco.js`) com **cinemática inversa (IK)**: você diz onde o
pé pisa ou onde a mão deve chegar, e o motor calcula joelho e cotovelo dentro dos limites do corpo.

Caminhos relativos a esta pasta (`SKILL_DIR`). O render continua sendo o da skill `edit`
(`../edit/scripts/render.mjs`).

## Regras de função motora (não quebre)

Leia `references/biomecanica.md` para os números. Resumo:

1. **Locomoção é de perfil.** Quem anda para a direita aparece de lado olhando para a direita
   (`dir: 1`); para a esquerda, `dir: -1`. De frente só parado, falando, gesticulando.
2. **Pé aponta para onde o corpo vai** e o pé de apoio **não escorrega**: ele fica plantado
   onde pisou até sair do chão (o motor calcula isso; nunca anime o pé com tween de x).
3. **Rolamento do pé**: calcanhar toca primeiro → pé chato → calcanhar sobe → ponta empurra.
4. **Joelho só dobra para trás** (a canela vai para trás da coxa), **cotovelo só dobra para frente**.
5. **Braço oposto à perna**: perna direita à frente → braço esquerdo à frente. Cotovelo levemente
   dobrado andando (~15°), ~90° correndo.
6. **Centro de massa**: quadril mais baixo logo após o contato, mais alto na passagem (sobe e
   desce ~2% da altura). Correndo, o tronco inclina para frente (~10°); subindo escada, ~9°.
7. **Mãos alcançam alvos por IK**: comer, pensar (queixo), tampar o nariz, pegar/entregar algo —
   a mão vai até o ponto e o cotovelo fica para baixo, como numa pessoa.
8. **Toda mudança de ação tem transição** (padrão 0,3 s). Na troca perfil↔frente o corpo troca
   rápido, mas a **cabeça gira suave** (olhos e boca deslizam passando por ¾).
10. **O rosto acompanha a cabeça**: inclinou ou deitou, o rosto gira junto (deitado de costas =
   rosto para cima). Falando, a cabeça acompanha levemente as sílabas.
9. **Escala**: o boneco tem ~570 unidades de altura com `escala: 1`. Use escala para caber na cena,
   nunca estique só uma parte.
11. **Todo mundo pisa no chão desenhado** (inclusive figurantes): o `y` dos pés tem que cair na faixa
   do chão da cena (calçada, piso, degrau) — nunca em cima de parede, balcão ou céu. Confira num quadro
   de prévia onde o chão começa antes de posicionar alguém.
12. **Perspectiva**: quem está mais longe (pés mais para cima no chão) é menor; quem está mais perto é
   maior. Escolha a escala pela altura dos pés, de forma coerente com os outros da mesma cena
   (ex.: pés em 1300 → 0,5; em 1700 → 0,8).
13. **Cabeça é uma esfera**: ao virar, olhos, sobrancelhas, boca, cabelo, nuca e tudo o que está
   preso na cabeça (manto/palla, capuz, capacete) giram juntos; o que passa para trás some.

## Uso

```html
<script src="boneco.js"></script>   <!-- copie assets/boneco.js para o projeto -->
<defs> ... <filter id="outline"> (contorno escuro; copie de assets/demo.html) ... </defs>
<g id="atores"></g>
```
```js
const heroi = new Boneco(document.querySelector('#atores'), {
  escala: 0.9, roupa: '#C8553D', seed: 4,
  boca: t => formaDaBoca(t)            // opcional: lipsync ('0'..'4' ou 'smile')
});
// BASE (pernas + tronco) — uma ação por intervalo
heroi.base(0, 3, 'andar',  { de: [100, 1700], ate: [700, 1700] });
heroi.base(3, 6, 'parado', { x: 700, y: 1700, vista: 'frente' });
heroi.base(6, 8, 'correr', { de: [700, 1700], ate: [100, 1700] });
heroi.base(8, 11, 'subir', { de: [x0, y], ate: [x1, y], chao: x => alturaDoDegrau(x), passo: larguraDoDegrau });
heroi.base(11, 14, 'sentar', { x: assentoX, y: assentoY, chao: 1700, dir: 1 });
heroi.base(14, 15, 'pular', { x, y, vista: 'frente', altura: 80 });
heroi.base(15, 16, 'deitado', { x, y, dir: 1 });  // depois 'parado' com transicao: 0.8 = levantar
heroi.base(16, 17, 'agachar', { x, y, vista: 'perfil', quanto: 70 });
// BRAÇOS (por cima da base): lado 'e', 'd' ou 'ambos'
heroi.braco('d', 3.5, 5, 'acenar');
// gestos: acenar, cima, desespero, encolher, abanar, apontar, estender, segurar, cintura,
//         comer, queixo, nariz, alcancar {alvo:[x,y]}, pose {o, c}
// CABEÇA e ROSTO
heroi.cabeca(4, 5, { virar: 0 });            // virar a cabeça: 0 = de frente, ±1 = perfil, ±0.5 = ¾ (gira suave)
heroi.cabeca(5, 6, { inclinar: 10, baixar: 8, olhar: [3, -4] });  // inclinar (graus), baixar (olhar p/ baixo), pupilas
heroi.cabeca(6, 7, { gesto: 'sim' });        // gestos: 'sim' (concordar), 'nao' (negar), 'balancar'
heroi.expressao(4, 6, 'feliz');   // ver lista de expressões abaixo
heroi.sujeira(10, 20);            // manchas de fuligem/sujeira
// a cada quadro (dentro de window.__seek):
heroi.desenhar(t);
const [mx, my] = heroi.mao('e');  // posição da mão para prender objetos (pão, jarro, moeda)
```

- No perfil com `dir: 1`, o braço **'e' é o de perto** (desenhado na frente); com `dir: -1`, o 'd'.
  Objetos segurados vão na mão de perto.
- `subir`/`andar` com `chao: x => y` plantam cada pé na altura do degrau. Faça `passo` igual
  à largura do degrau e comece `de[0]` em `centroDoPrimeiroDegrau - 0.55 * passo` para os pés
  caírem no meio dos degraus.
- Para várias pessoas, crie vários `Boneco` (seeds diferentes para não piscarem juntos).
- Visibilidade por cena: envolva cada boneco num `<g>` e ligue/desligue no `__seek`.

## Expressões do rosto

`heroi.expressao(t0, t1, nome)` — 24 expressões (grade visual em `assets/expressoes.html`):

| Emoção | Nomes |
|---|---|
| Alegria | `feliz` (olhos ^ ^), `alegre` (sorrisão, corado), `aliviado` (olhos fechados + gota) |
| Neutro/atenção | `normal`, `serio` (sobrancelhas retas e baixas, boca reta), `determinado`, `desconfiado` (pálpebra caída, boca de lado), `pensando`, `confuso` |
| Raiva | `bravo` (pontas internas das sobrancelhas para baixo, dentes, veia), `furioso` (grito, rosto vermelho, treme) |
| Surpresa/medo | `surpreso` (boca O), `susto` (olhos arregalados, linhas de choque), `espanto` (susto + grito + suor), `medo` (sobrancelhas de preocupação, boca tremendo, treme), `preocupado`, `gritando` |
| Tristeza | `triste`, `chorando` (lágrimas), `cansado` (pálpebras pesadas, suor), `envergonhado` (corado, olhar baixo) |
| Outros | `nojo` (bochechas verdes, boca ondulada), `tonto` (olhos X), `dormindo` (Zzz) |

- Entrada e saída da expressão levam 0,15 s (sobrancelhas e pálpebras deslizam).
- **Falando** (com `boca` de lipsync), a boca segue a voz mas no formato da emoção:
  `feliz/alegre` abre em "D", `triste/medo` com cantos para baixo, `bravo` mostra dentes,
  `gritando/furioso/espanto` abre até ~1,9× mais com língua e dentes.
- Escolha pela **fala**: o que o personagem sente naquela frase. Troque a expressão a cada
  ideia nova (2–4 s), não a cada palavra.
- Detalhes finos (veia, linhas de choque, Zzz, gotas) ficam fora do contorno para não virar borrão.

## Verificar (sempre)

Gere quadros de prévia com `../edit/scripts/render.mjs cena.html --frames ...` em momentos de
**contato** (pés afastados), **passagem** (pés juntos) e em cada gesto. Confira: pé apontando para
a direção do movimento, pé de apoio parado no mesmo lugar entre dois quadros, joelho nunca dobrado
para frente, mão chegando no alvo. `assets/demo.html` mostra todos os movimentos — use como
referência visual e para testar mudanças no motor.

**Zumbi**: figurino e expressão `'zumbi'`; caminhada arrastada (passo 70%, sem balanço de braço,
braços estendidos à frente). Personagem dentro de veículo: grupo com o boneco **sentado** e o
veículo desenhado por cima (janela semitransparente), movidos juntos.

**Montado (moto, bicicleta, carro)** — `base(t0, t1, 'montar', { assento, pe | pedivela: { c, r, rpm }, guidao, chao })`:
quadril no banco, pés na pedaleira (ou girando no pedal), mãos no guidão/volante; o tronco inclina sozinho o
necessário para alcançar. Nunca usar `sentar` com o chão lá embaixo para veículo (fica "de pé na moto").
Pontos prontos: `DT.ponto('moto'|'bicicleta', nome, k)` e `Z.carro.pontos`. Regras completas: skill `fisica-de-cena`.

**Gestos novos** (guia de mãos do Sobrevivente): `explicar`, `parar`, `levantar`, `joinha`, `chamar`, `contar` (`{ n }`),
`cruzar`, `cabeca`, `testa`. Personagens com `luvas: true` desenham **mãos em forma** (aberta, punho, apontar, joinha,
paz, ok, palma, n1…n5) que seguem o gesto; `b.formaMao(lado, t0, t1, forma)` força uma forma. Detalhes: skill `personagem-sobrevivente`.
